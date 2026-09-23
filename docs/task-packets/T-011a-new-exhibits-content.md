# T-011a — three new exhibits (content)

**ID:** T-011a-new-exhibits-content
**Project:** /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
**Worker:** `content-writer` sub-agent (Opus 5)
**Sandbox:** write under `docs/content/` only; no network
**Limit:** 45 minutes, two repair attempts, then stop and report the blocker factually.

## Objective
Write three new exhibits — one per wing — with their outcomes, consequence tags, chain links, ticket phrases and a brief for each blueprint plate, as a reviewable JSON proposal. No Sanity writes, no code.

## Why this exists
The museum has three exhibits, one per wing; a visitor finishes in about a minute. The founder approved growing it to six (two per wing). Every exhibit must join the existing chain (the "Continue to →" walk) and feed the visitor's ticket, or it becomes a dead end.

## Read first — do NOT change these
- `docs/content/first-exhibit.json`, `docs/content/remaining-exhibits.json` — the live eras, artifacts and outcomes. Match their voice exactly: dry, precise, museum-label calm about impossible things.
- `docs/content/chain-outcomes.json` and `.md` — the current tags and the current walk.
- `docs/content/ticket-lines.json` — how tags become sentences on the ticket (`tagPhrases`). Each phrase must read naturally after "Your trace carries you …" style stems — study the existing 14 phrases and match their grammar exactly (participle/prepositional phrases like "carrying a day…", "with your weekend still unspent").
- `docs/design/blueprint-plate-spec.md` — so your plate briefs describe things the plate style can draw (line art, callouts, labelled parts).
- `schemas/artifact.ts`, `schemas/outcome.ts` — the limits below come from them.

## Wings (era `_id`s) — one new exhibit in each
- `era-near-future-civic-time` (civic time; existing: the vending machine that sells extra Mondays). The plan once mentioned "a toaster that prints messages from your future self" — you may use it or not.
- `era-counterfactual-communications` (existing: the telephone for roads not taken)
- `era-domestic-weather-memory` (existing: the umbrella that remembers every storm)
Check the exact era `_id`s against the JSON files; if any differ, use the file's value and say so.

## Deliverable 1 — `docs/content/new-exhibits.json`
```json
{
  "artifacts": [
    {
      "_id": "artifact-<slug>",
      "title": "...", "slug": "...", "era": "era-...",
      "accessionNote": "...", "summary": "...", "artifactLabel": "...", "visualDescription": "...",
      "imageAlt": "...",
      "choices": [ { "_key": "kebab-key", "label": "...", "outcome": "outcome-..." } ]
    }
  ],
  "outcomes": [
    {
      "_id": "outcome-...", "title": "...", "body": "...", "era": "era-...",
      "consequenceTags": ["..."],
      "leadsTo": "artifact-<id of an existing or new artifact>",
      "why": "one sentence: why this outcome hands the visitor there"
    }
  ],
  "rewire": [
    { "outcome": "outcome-<existing id>", "from": "artifact-<current>", "to": "artifact-<new>", "why": "..." }
  ],
  "newTagPhrases": { "tag-name": "phrase" },
  "plateBriefs": [
    { "artifact": "artifact-<slug>", "patentNo": "...", "figures": "fig. 1 / fig. 2 — what each shows", "labelledParts": ["..."], "motif": "one line" }
  ]
}
```

Limits (hard — the dataset validator enforces them):
- artifact `title` 3–100; `accessionNote` 8–120; `summary` 40–320; `artifactLabel` 20–240; `visualDescription` 30–320; `imageAlt` 20–320; slug lowercase-hyphenated, unique vs. existing slugs.
- **2–4 choices** per artifact; choice `label` 3–80; `_key` lowercase-hyphenated, unique within the artifact. At least one of the three new exhibits must have **three** choices (the schema now allows 2–4 and nothing live shows it yet).
- Every choice points to a **new** outcome written for it (no sharing outcomes between artifacts).
- outcome `title` 3–90, `body` 30–520, `era` = its artifact's era.
- `consequenceTags`: 1–4 per outcome, each `^[a-z0-9-]{2,32}$`, unique within the outcome. Consequences to the visitor's future, not topic labels. Reuse existing tags where futures genuinely rhyme; new tags need a phrase in `newTagPhrases`. Every tag you use must end up with a phrase (existing or new).
- `leadsTo`: exactly one per outcome; never the outcome's own artifact.

## Chain rules
- Each new outcome leads onward, and together the new outcomes must reach all three wings.
- Each new artifact must be **reachable from the existing walk**: propose `rewire` entries repointing at most **three** existing outcomes' `leadsTo` to new artifacts (existing tags stay untouched). The founder approves rewires before anything goes live.
- After your changes, every one of the six artifacts must be reachable from every other by following "Continue to →" links (one strongly connected walk). Cycles are fine. Check this by hand and list the final graph.

## Deliverable 2 — `docs/content/new-exhibits.md`
Plain-language note for the founder (who reads it before approving): the three exhibits in two sentences each, the new walk, and what changed in the old walk.

## Forbidden
Everything outside `docs/content/new-exhibits.json` and `docs/content/new-exhibits.md`. In particular do not edit the existing content JSON, `ticket-lines.json`, `schemas/**`, `src/**`, `scripts/**`, `tests/**`, `docs/task-packets/**`, `docs/TASK_BOARD.md`, `docs/build-log.md`, `.env*`. Do not call Sanity. Do not commit.

## Acceptance (orchestrator re-runs a validator script against these rules)
- JSON parses; 3 artifacts, one per era; 7+ outcomes; one artifact has 3 choices.
- All length/regex limits met; every tag has a phrase; no self-loop; graph over all six artifacts strongly connected; ≤3 rewires.

## Required output
- the two file paths
- the final graph (outcome → artifact) for all outcomes, old and new
- new tags with their phrases
- anything not done, stated plainly
