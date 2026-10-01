// The Acquisitions Clerk: an agent that drafts a new exhibit, submits it to
// the exhibit-review workflow, and revises it when a curator asks for changes.
// It never approves, displays or publishes. See docs/acquisitions-clerk.md.
//
// Every command is a dry run unless CLERK_EXECUTE=1. The Clerk runs on its own
// robot token (SANITY_CLERK_TOKEN in .env.local) so the workflow history
// records the Clerk, not the curator. CLERK_GENERATOR picks the free writer:
// "sanity" (Agent Actions, free monthly AI credits) or "ollama" (local).
//
//   npx sanity exec scripts/acquisitions-clerk.ts -- draft "<brief>" --wing <era-slug>
//   npx sanity exec scripts/acquisitions-clerk.ts -- revise <artifactId>
//   npx sanity exec scripts/acquisitions-clerk.ts -- sync <artifactId>
//   npx sanity exec scripts/acquisitions-clerk.ts -- status <artifactId>
//
// The curator's own step, on the curator's login (never the Clerk's token):
//   CLERK_EXECUTE=1 npx sanity exec scripts/acquisitions-clerk.ts --with-user-token -- publish <artifactId>
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  createEngine,
  instanceDocId,
  refDataset,
  type Engine,
} from "@sanity/workflow-engine";
import { getCliClient } from "sanity/cli";
import { produceValidDraft, type ProduceDraftResult } from "../src/agents/acquisitions-clerk/clerk";
import {
  assertClerkMayFire,
  decideNextMove,
  type WorkflowView,
} from "../src/agents/acquisitions-clerk/decide";
import {
  buildClerkDocuments,
  buildRevisionSets,
  draftFromDocuments,
  uniqueSlug,
  type ClerkArtifactDraft,
  type ClerkOutcomeDraft,
} from "../src/agents/acquisitions-clerk/documents";
import {
  createFakeGenerator,
  createOllamaGenerator,
  createSanityGenerator,
  readGeneratorChoice,
  type Generator,
} from "../src/agents/acquisitions-clerk/generate";
import type { PromptExample } from "../src/agents/acquisitions-clerk/prompt";
import { reviewWrite, syncReviewFromWorkflow } from "../src/agents/acquisitions-clerk/sync";
import { clerkDraftJsonSchema } from "../src/agents/acquisitions-clerk/validate";
import { sanityDataset, sanityProjectId } from "../src/content/sanity-config";
import ticketLines from "../src/content/ticket-lines.json";
import {
  getArtifactReviewId,
  getPublishEligibility,
  type ArtifactReview,
} from "../src/domain/artifact-review";

const apiVersion = "2026-09-20";
const TAG = "production";
const DEFINITION = "exhibit-review";
const workflowResource = {
  type: "dataset",
  id: `${sanityProjectId}.${sanityDataset}`,
} as const;
const execute = process.env.CLERK_EXECUTE === "1";
const evidenceDir = "evidence/T-018";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

type Client = ReturnType<typeof getCliClient>;
type Stored<T> = T & { _rev: string; _updatedAt?: string; _createdAt?: string };

type InstanceDoc = {
  _id: string;
  currentStage?: string;
  completedAt?: string;
  fields?: Array<{ name: string; value?: unknown }>;
};

const { positionals, values } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: { wing: { type: "string" } },
});
const [command, ...rest] = positionals;

try {
  switch (command) {
    case "draft":
      await draftCommand(rest.join(" "), values.wing);
      break;
    case "revise":
      await reviseCommand(requireArtifactId(rest[0]));
      break;
    case "sync":
      await syncCommand(requireArtifactId(rest[0]));
      break;
    case "status":
      await statusCommand(requireArtifactId(rest[0]));
      break;
    case "publish":
      await publishCommand(requireArtifactId(rest[0]));
      break;
    default:
      fail(
        'Unknown command. Use: draft "<brief>" --wing <era-slug> | revise <artifactId> | sync <artifactId> | status <artifactId> | publish <artifactId>',
      );
  }
} catch (error) {
  console.error(`\n✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

// ── Commands ────────────────────────────────────────────────────────────────

async function draftCommand(brief: string, wingSlug: string | undefined) {
  if (!brief.trim()) fail('Give the Clerk a brief: draft "<one-line idea>" --wing <era-slug>');
  if (!wingSlug) fail("Pick a wing with --wing <era-slug>.");

  const clerk = await clerkClient();
  const era = await clerk.fetch<{ _id: string; title: string; summary?: string } | null>(
    `*[_type == "era" && slug.current == $slug && !(_id in path("drafts.**"))][0]{_id, title, summary}`,
    { slug: wingSlug },
  );
  if (!era) {
    const wings = await clerk.fetch<string[]>(
      `*[_type == "era" && !(_id in path("drafts.**"))].slug.current`,
    );
    fail(`No wing "${wingSlug}". Wings: ${wings.join(", ")}`);
  }

  const collection = await readCollection(clerk);
  const generator = makeGenerator(clerk);
  log(`Clerk is drafting with ${generator.name}…`);

  const result = await produceValidDraft({
    generator,
    prompt: {
      brief,
      wing: { title: era.title, summary: era.summary },
      examples: pickExamples(collection.published, era._id),
      tagPhrases: ticketLines.tagPhrases,
      leadsToOptions: collection.published.map(({ _id, title }) => ({ _id, title })),
    },
    context: collectionContext(collection),
  });

  if (!result.ok) {
    await evidence("draft-rejected", { brief, wing: wingSlug, generator: generator.name, result });
    fail(`The generator's draft failed validation twice; nothing was written.\n  ${result.reasons.join("\n  ")}`);
  }

  const slug = uniqueSlug(result.draft.title, collection.takenSlugs);
  const documents = buildClerkDocuments({ draft: result.draft, slug, eraId: era._id });

  if (!execute) {
    await evidence("draft-dry-run", { brief, wing: wingSlug, generator: generator.name, documents, attempts: result.attempts });
    log(JSON.stringify(documents, null, 2));
    log("\nDry run: nothing written. Set CLERK_EXECUTE=1 to create the drafts and submit them for review.");
    return;
  }

  const transaction = clerk.transaction();
  for (const outcome of documents.outcomes) transaction.create(outcome);
  transaction.create(documents.artifact);
  await transaction.commit();
  log(`Created ${documents.artifact._id} and its two endings (drafts only).`);

  const engine = clerkEngine(clerk);
  const { instance } = await engine.startInstance({
    definition: DEFINITION,
    instanceId: instanceDocId(TAG),
    initialFields: [
      {
        type: "subject",
        name: "subject",
        value: refDataset({
          projectId: sanityProjectId,
          dataset: sanityDataset,
          documentId: documents.artifactId,
          type: "artifact",
        }),
      },
    ],
  });
  log(`Started ${DEFINITION} run ${instance._id}.`);

  await clerkSubmit(engine, instance._id);
  const gate = await syncGate(clerk, documents.artifactId);

  await evidence("draft-executed", {
    brief,
    wing: wingSlug,
    generator: generator.name,
    documents,
    attempts: result.attempts,
    instanceId: instance._id,
    gate,
  });
  log(`\n✓ ${documents.artifactId} is waiting for a curator in Studio (Curatorial review).`);
}

async function reviseCommand(artifactId: string) {
  const clerk = await clerkClient();
  const instance = await requireInstance(clerk, artifactId);
  const move = decideNextMove(workflowView(instance));

  if (move.kind !== "revise") {
    log(`Nothing to revise: ${describeMove(move)}`);
    return;
  }

  const artifact = await clerk.getDocument<Stored<ClerkArtifactDraft>>(`drafts.${artifactId}`);
  if (!artifact) fail(`drafts.${artifactId} does not exist.`);
  const outcomeIds = artifact.choices.map((choice) => `drafts.${choice.outcome._ref}`);
  const outcomes = await Promise.all(
    outcomeIds.map((id) => clerk.getDocument<Stored<ClerkOutcomeDraft>>(id)),
  );
  if (outcomes.some((outcome) => !outcome)) {
    fail(`An ending draft is missing (${outcomeIds.join(", ")}); the Clerk only revises its own unpublished drafts.`);
  }

  const collection = await readCollection(clerk);
  const generator = makeGenerator(clerk);
  log(`Curator's note: "${move.reason}"\nClerk is revising with ${generator.name}…`);

  const era = await clerk.fetch<{ title: string; summary?: string } | null>(
    `*[_id == $id][0]{title, summary}`,
    { id: artifact.era._ref },
  );
  const result: ProduceDraftResult = await produceValidDraft({
    generator,
    prompt: {
      brief: `Revise the exhibit "${artifact.title}".`,
      wing: { title: era?.title ?? artifact.era._ref, summary: era?.summary },
      examples: pickExamples(collection.published, artifact.era._ref),
      tagPhrases: ticketLines.tagPhrases,
      leadsToOptions: collection.published.map(({ _id, title }) => ({ _id, title })),
      revision: { reason: move.reason, previous: draftFromDocuments(artifact, outcomes) },
    },
    context: collectionContext(collection),
  });

  if (!result.ok) {
    await evidence("revise-rejected", { artifactId, reason: move.reason, generator: generator.name, result });
    fail(`The revision failed validation twice; nothing was written.\n  ${result.reasons.join("\n  ")}`);
  }

  const sets = buildRevisionSets(result.draft);
  if (!execute) {
    await evidence("revise-dry-run", { artifactId, reason: move.reason, generator: generator.name, sets, attempts: result.attempts });
    log(JSON.stringify(sets, null, 2));
    log("\nDry run: nothing written. Set CLERK_EXECUTE=1 to save the revision and resubmit.");
    return;
  }

  // Record the curator's request on the gate before the draft changes.
  await syncGate(clerk, artifactId);

  const transaction = clerk.transaction();
  transaction.patch(artifact._id, (patch) => patch.ifRevisionId(artifact._rev).set(sets.artifact));
  outcomes.forEach((outcome, index) => {
    if (!outcome) return;
    transaction.patch(outcome._id, (patch) => {
      const next = patch.ifRevisionId(outcome._rev).set(sets.outcomes[index]);
      return sets.unsetLeadsTo[index] ? next.unset(["leadsTo"]) : next;
    });
  });
  await transaction.commit();
  log("Saved the revised draft.");

  const engine = clerkEngine(clerk);
  await clerkSubmit(engine, instance._id);
  const gate = await syncGate(clerk, artifactId);

  await evidence("revise-executed", {
    artifactId,
    reason: move.reason,
    generator: generator.name,
    sets,
    attempts: result.attempts,
    instanceId: instance._id,
    gate,
  });
  log(`\n✓ Revised and resubmitted ${artifactId}.`);
}

async function syncCommand(artifactId: string) {
  const clerk = await clerkClient();
  if (!execute) {
    log(JSON.stringify(await planGate(clerk, artifactId), null, 2));
    log("\nDry run: the gate was not changed. Set CLERK_EXECUTE=1 to apply.");
    return;
  }
  log(JSON.stringify(await syncGate(clerk, artifactId), null, 2));
}

async function statusCommand(artifactId: string) {
  const clerk = await clerkClient();
  const instance = await findInstance(clerk, artifactId);
  const view = instance ? workflowView(instance) : undefined;
  const draft = await clerk.getDocument<{ _rev: string }>(`drafts.${artifactId}`);
  const review = await readReview(clerk, artifactId);

  log(
    JSON.stringify(
      {
        artifactId,
        workflowRun: instance?._id ?? null,
        workflow: view ?? null,
        draftRevision: draft?._rev ?? null,
        gate: review ? { state: review.state, submittedRevision: review.submittedRevision, approvedRevision: review.approvedRevision } : null,
        publish: getPublishEligibility({ review, draftRevision: draft?._rev }),
        clerkNextMove: describeMove(decideNextMove(view ?? { stage: undefined, reviewDecision: null, changeRequestReason: null })),
      },
      null,
      2,
    ),
  );
}

async function publishCommand(artifactId: string) {
  const curator = getCliClient({ apiVersion }).withConfig({ perspective: "raw" });
  if (!curator.config().token) {
    fail("publish is the curator's step. Run it with --with-user-token after `npx sanity login`.");
  }
  if (process.env.SANITY_CLERK_TOKEN && curator.config().token === process.env.SANITY_CLERK_TOKEN) {
    fail("publish refuses the Clerk's token.");
  }
  const me = await currentUser(curator);
  if (!me.roles.includes("administrator")) {
    fail(`publish needs a project administrator; ${me.id} has roles [${me.roles.join(", ")}].`);
  }

  const instance = await requireInstance(curator, artifactId);
  const stage = instance.currentStage;
  if (stage !== "approved" && stage !== "on-display") {
    fail(`The ${DEFINITION} run is in "${stage}". A curator must approve it in Studio first.`);
  }

  const artifact = await curator.getDocument<Stored<ClerkArtifactDraft>>(`drafts.${artifactId}`);
  if (!artifact) fail(`drafts.${artifactId} does not exist (already published?).`);
  const review = await readReview(curator, artifactId);
  const eligibility = getPublishEligibility({ review, draftRevision: artifact._rev });
  if (!eligibility.eligible) {
    fail(`The review gate refuses: ${JSON.stringify(eligibility)}. Run "sync ${artifactId}" if Studio moves were not mirrored yet.`);
  }

  const outcomes = await Promise.all(
    artifact.choices.map((choice) =>
      curator.getDocument<Stored<ClerkOutcomeDraft>>(`drafts.${choice.outcome._ref}`),
    ),
  );
  const approvedAt = review?.approvedAt ?? "";
  for (const [index, outcome] of outcomes.entries()) {
    const ref = artifact.choices[index].outcome._ref;
    if (!outcome) {
      const published = await curator.getDocument(ref);
      if (!published) fail(`Ending ${ref} has neither a draft nor a published version.`);
      continue;
    }
    if (outcome._updatedAt && approvedAt && outcome._updatedAt > approvedAt) {
      fail(`Ending ${ref} changed after approval (${outcome._updatedAt} > ${approvedAt}). Send it back through review.`);
    }
  }

  const plan = {
    artifactId,
    approvedRevision: review?.approvedRevision,
    publishes: [...outcomes.filter(Boolean).map((outcome) => outcome!._id), artifact._id],
  };
  if (!execute) {
    log(JSON.stringify(plan, null, 2));
    log("\nDry run: nothing published. Set CLERK_EXECUTE=1 to publish the endings and the exhibit together.");
    return;
  }

  const transaction = curator.transaction();
  for (const outcome of outcomes) {
    if (!outcome) continue;
    transaction.createOrReplace({ ...stripSystemFields(outcome), _id: publishedId(outcome._id) });
    transaction.delete(outcome._id);
  }
  transaction.createOrReplace({
    ...stripSystemFields(artifact),
    _id: artifactId,
    choices: artifact.choices.map((choice) => ({
      _key: choice._key,
      _type: choice._type,
      label: choice.label,
      outcome: { _type: "reference", _ref: choice.outcome._ref },
    })),
  });
  transaction.delete(artifact._id);
  await transaction.commit();
  log(`Published ${plan.publishes.map(publishedId).join(", ")}.`);

  if (stage === "approved") {
    const engine = createEngine({
      client: curator,
      workflowResource,
      tag: TAG,
      executionContext: { kind: "script", id: "acquisitions-clerk-publish" },
    });
    await engine.fireAction({ instanceId: instance._id, activity: "display", action: "put-on-display" });
    log("Put the exhibit on display in the workflow, as the curator.");
  }

  await evidence("publish-executed", { ...plan, curator: me.id });
  log(`\n✓ ${artifactId} is live. The site shows it within about a minute.`);
}

// ── The gate bridge ─────────────────────────────────────────────────────────

async function planGate(client: Client, artifactId: string) {
  const instance = await requireInstance(client, artifactId);
  const draft = await client.getDocument<{ _rev: string }>(`drafts.${artifactId}`);
  const review = await readReview(client, artifactId);
  const result = syncReviewFromWorkflow({
    artifactId,
    workflow: workflowView(instance),
    review,
    draftRevision: draft?._rev,
    now: new Date().toISOString(),
  });
  return { instance, review, result };
}

async function syncGate(client: Client, artifactId: string) {
  const { review, result } = await planGate(client, artifactId);

  if (!result.ok) {
    throw new Error(`The review gate refused the sync: ${JSON.stringify(result)}`);
  }
  if (result.status === "noop" || !result.review) {
    log("Gate already matches the workflow.");
    return result;
  }

  await saveReview(client, result.review, review);
  log(`Gate is now "${result.review.state}".`);
  return result;
}

async function saveReview(
  client: Client,
  next: ArtifactReview,
  previous: Stored<ArtifactReview> | null,
) {
  const write = reviewWrite(next, previous);
  if (write.kind === "create") {
    await client.create(write.document);
    return;
  }
  await client
    .patch(write.id)
    .ifRevisionId(write.ifRevisionId)
    .set(write.set)
    .unset(write.unset)
    .commit();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function clerkClient(): Promise<Client> {
  const token = process.env.SANITY_CLERK_TOKEN;
  const base = getCliClient({ apiVersion }).withConfig({ perspective: "raw", useCdn: false });

  if (!token) {
    if (execute) {
      fail("SANITY_CLERK_TOKEN is missing from .env.local. The Clerk needs its own Editor robot token so the history records the Clerk, not you.");
    }
    log("! No SANITY_CLERK_TOKEN: dry run reads published content only.");
    return base.withConfig({ token: undefined });
  }

  const clerk = base.withConfig({ token });
  const me = await currentUser(clerk).catch(() => null);
  if (me?.roles.includes("administrator")) {
    fail("SANITY_CLERK_TOKEN belongs to an administrator. Give the Clerk an Editor token so it cannot approve its own work.");
  }
  return clerk;
}

function clerkEngine(clerk: Client): Engine {
  return createEngine({
    client: clerk,
    workflowResource,
    tag: TAG,
    executionContext: { kind: "script", id: "acquisitions-clerk" },
  });
}

async function clerkSubmit(engine: Engine, instanceId: string) {
  const action = "submit";
  assertClerkMayFire(action);
  await engine.fireAction({ instanceId, activity: "draft", action });
  log("Clerk fired submit → Curatorial review.");
}

function makeGenerator(clerk: Client): Generator {
  const choice = readGeneratorChoice(process.env.CLERK_GENERATOR);

  if (choice === "file") {
    // A rehearsal: replays a saved answer so the dry run can be checked
    // without credits or Ollama. Never used for a real run, because then a
    // person, not the Clerk, would have written the exhibit.
    if (execute) fail("CLERK_GENERATOR=file is for dry runs only.");
    const file = process.env.CLERK_ANSWER_FILE;
    if (!file) fail("CLERK_GENERATOR=file needs CLERK_ANSWER_FILE=<path to a JSON answer>.");
    return createFakeGenerator([JSON.parse(readFileSync(file, "utf8"))]);
  }

  if (choice === "ollama") {
    return createOllamaGenerator({
      fetch: (url, init) => fetch(url, init),
      baseUrl: process.env.CLERK_OLLAMA_URL,
      model: process.env.CLERK_OLLAMA_MODEL,
      jsonSchema: clerkDraftJsonSchema(),
    });
  }

  if (!clerk.config().token) {
    fail("CLERK_GENERATOR=sanity needs SANITY_CLERK_TOKEN (Agent Actions require a token).");
  }
  return createSanityGenerator(clerk.withConfig({ apiVersion: "vX" }));
}

type PublishedArtifact = PromptExample & { _id: string; slug: string; era: string };

async function readCollection(client: Client) {
  const published = await client.fetch<PublishedArtifact[]>(
    `*[_type == "artifact" && !(_id in path("drafts.**"))] | order(title asc){
      _id, title, "slug": slug.current, "era": era._ref, accessionNote, summary, artifactLabel,
      "choices": choices[]{label, "outcomeTitle": outcome->title, "outcomeBody": outcome->body}
    }`,
  );
  const draftSlugs = client.config().token
    ? await client.fetch<string[]>(`*[_type == "artifact" && _id in path("drafts.**")].slug.current`)
    : [];
  return {
    published,
    takenSlugs: [...published.map((artifact) => artifact.slug), ...draftSlugs].filter(Boolean),
  };
}

function collectionContext(collection: Awaited<ReturnType<typeof readCollection>>) {
  return {
    tagVocabulary: Object.keys(ticketLines.tagPhrases),
    leadsToOptions: collection.published.map((artifact) => artifact._id),
    existingTitles: collection.published.map((artifact) => artifact.title),
  };
}

function pickExamples(published: PublishedArtifact[], eraId: string): PromptExample[] {
  const sameWing = published.filter((artifact) => artifact.era === eraId);
  const others = published.filter((artifact) => artifact.era !== eraId);
  return [...sameWing, ...others].slice(0, 3);
}

async function findInstance(client: Client, artifactId: string): Promise<InstanceDoc | null> {
  const subjectId = refDataset({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    documentId: artifactId,
    type: "artifact",
  }).id;
  return client.fetch<InstanceDoc | null>(
    `*[_type == "sanity.workflow.instance" && tag == $workflowTag && definition == $definition
       && count(fields[_type == "subject" && value.id == $subjectId]) > 0]
     | order(defined(completedAt) asc, _createdAt desc)[0]{_id, currentStage, completedAt, fields}`,
    { workflowTag: TAG, definition: DEFINITION, subjectId },
  );
}

async function requireInstance(client: Client, artifactId: string) {
  const instance = await findInstance(client, artifactId);
  if (!instance) fail(`No ${DEFINITION} run found for ${artifactId}.`);
  return instance;
}

function workflowView(instance: InstanceDoc): WorkflowView {
  const field = (name: string) => instance.fields?.find((entry) => entry.name === name)?.value;
  const asText = (value: unknown) => (typeof value === "string" ? value : null);
  return {
    stage: instance.currentStage,
    reviewDecision: asText(field("reviewDecision")),
    changeRequestReason: asText(field("changeRequestReason")),
  };
}

async function readReview(client: Client, artifactId: string) {
  return client.getDocument<Stored<ArtifactReview>>(getArtifactReviewId(artifactId)).then(
    (review) => review ?? null,
  );
}

async function currentUser(client: Client): Promise<{ id: string; roles: string[] }> {
  const me = await client.request<{
    id: string;
    role?: string;
    roles?: Array<{ name: string }>;
  }>({ url: "/users/me" });
  const roles = new Set<string>(me.roles?.map((role) => role.name) ?? []);
  if (me.role) roles.add(me.role);
  return { id: me.id, roles: [...roles] };
}

function describeMove(move: ReturnType<typeof decideNextMove>) {
  switch (move.kind) {
    case "start-and-submit":
      return "no run yet; the Clerk starts one when it drafts.";
    case "submit":
      return "submit the draft for curatorial review.";
    case "revise":
      return `revise for the note: "${move.reason}".`;
    case "wait":
      return move.why;
  }
}

function publishedId(id: string) {
  return id.replace(/^drafts\./, "");
}

function stripSystemFields<T extends Record<string, unknown>>(document: T) {
  const copy: Record<string, unknown> = { ...document };
  delete copy._rev;
  delete copy._createdAt;
  delete copy._updatedAt;
  return copy as T & { _id: string; _type: string };
}

function requireArtifactId(value: string | undefined): string {
  if (!value || !/^artifact-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    fail("Give an artifact id like artifact-the-doormat-that-learns (no drafts. prefix).");
  }
  return value;
}

async function evidence(kind: string, payload: unknown) {
  await mkdir(evidenceDir, { recursive: true });
  const file = `${evidenceDir}/clerk-${kind}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  await writeFile(file, `${JSON.stringify(payload, null, 2)}\n`);
  log(`(evidence: ${file})`);
}

function log(message: string) {
  console.log(message);
}

function fail(message: string): never {
  throw new Error(message);
}
