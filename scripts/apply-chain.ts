// Dry run: npx sanity exec scripts/apply-chain.ts --with-user-token
// Real run: CHAIN_EXECUTE=1 npx sanity exec scripts/apply-chain.ts --with-user-token
import { mkdir, writeFile } from "node:fs/promises";
import { getCliClient } from "sanity/cli";
import chainProposal from "../docs/content/chain-outcomes.json";
import {
  buildOutcomePatch,
  checkPreconditions,
  parseChainProposal,
  type ChainEntry,
  type OutcomePatch,
  type PublishedOutcomeDocument,
} from "../src/domain/chain-application";

const apiVersion = "2026-09-20";
const execute = process.env.CHAIN_EXECUTE === "1";
const evidenceFile = "evidence/T-009/apply-chain-executed.json";
const client = getCliClient({ apiVersion });

type PreparedOutcome = {
  entry: ChainEntry;
  published: PublishedOutcomeDocument & { _rev: string };
  patch: OutcomePatch;
};

type EvidenceEntry = {
  id: string;
  revisionBefore: string;
  revisionAfter: string;
  consequenceTags: string[];
  leadsTo: {
    _type: "reference";
    _ref: string;
  };
};

const parsed = parseChainProposal(chainProposal);

if (!parsed.ok) {
  console.error(`Chain proposal rejected: ${parsed.reason}`);
  process.exit(1);
}

let prepared: PreparedOutcome[];

try {
  prepared = await prepareAllOutcomes(parsed.entries);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}

if (!execute) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        outcomes: prepared.map((outcome) => ({
          id: outcome.entry._id,
          revision: outcome.published._rev,
          patch: outcome.patch,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const evidence = await applyAllOutcomes(prepared);
await writeEvidence(evidence);

console.log(`${evidence.length} documents modified.`);

async function prepareAllOutcomes(
  entries: ChainEntry[],
): Promise<PreparedOutcome[]> {
  return step("preflight", async () => {
    const outcomes = await Promise.all(
      entries.map(async (entry) => {
        const [published, draft] = await Promise.all([
          getDocument<PublishedOutcomeDocument>(entry._id),
          getDocument<PublishedOutcomeDocument>(`drafts.${entry._id}`),
        ]);

        if (draft) {
          throw new Error(`Draft drafts.${entry._id} already exists.`);
        }

        const check = checkPreconditions(published, entry);

        if (!check.ok) {
          throw new Error(check.reason);
        }

        if (!published) {
          throw new Error(`Published outcome ${entry._id} was not found.`);
        }

        if (!published._rev) {
          throw new Error(`Published outcome ${entry._id} did not include a revision.`);
        }

        return {
          entry,
          published: { ...published, _rev: published._rev },
          patch: buildOutcomePatch(entry, published),
        };
      }),
    );

    return outcomes;
  });
}

async function applyAllOutcomes(
  outcomes: PreparedOutcome[],
): Promise<EvidenceEntry[]> {
  await step("apply patches", async () => {
    let transaction = client.transaction();

    for (const outcome of outcomes) {
      transaction = transaction.patch(
        client
          .patch(outcome.entry._id)
          .ifRevisionId(outcome.published._rev)
          .set(outcome.patch),
      );
    }

    await transaction.commit();
  });

  const finalDocuments = await step("read back", () =>
    Promise.all(
      outcomes.map((outcome) =>
        requireDocument<PublishedOutcomeDocument>(outcome.entry._id),
      ),
    ),
  );

  return outcomes.map((outcome, index) => {
    const finalDocument = finalDocuments[index];

    if (!finalDocument._rev) {
      throw new Error(
        `Published outcome ${outcome.entry._id} did not include a final revision.`,
      );
    }

    return {
      id: outcome.entry._id,
      revisionBefore: outcome.published._rev,
      revisionAfter: finalDocument._rev,
      consequenceTags: [...outcome.patch.consequenceTags],
      leadsTo: outcome.patch.leadsTo,
    };
  });
}

async function writeEvidence(evidence: EvidenceEntry[]) {
  await mkdir("evidence/T-009", { recursive: true });
  await writeFile(
    evidenceFile,
    `${JSON.stringify({ mode: "executed", outcomes: evidence }, null, 2)}\n`,
    "utf8",
  );
}

async function requireDocument<T>(id: string): Promise<T> {
  const document = await getDocument<T>(id);

  if (!document) {
    throw new Error(`Document ${id} was not found.`);
  }

  return document;
}

async function getDocument<T>(id: string): Promise<T | undefined> {
  return (await client.getDocument(id)) as T | undefined;
}

async function step<T>(name: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Step failed (${name}): ${message}`, { cause: error });
  }
}
