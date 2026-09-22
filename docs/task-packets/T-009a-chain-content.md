# T-009a — consequence tags and the chain map (content)

**Worker:** `content-writer` sub-agent (Opus 5)
**Sandbox:** workspace-write, no network
**Limit:** 45 minutes, two repair attempts, then stop and report the blocker factually.

## Objective
Write the consequence tags for all six existing outcomes and design the `leadsTo` chain that turns three dead ends into a walk across the museum — as a reviewable JSON proposal, without touching Sanity or any code.

## Why this exists
`outcome.consequenceTags` and `outcome.leadsTo` were added to the schema in T-003 and are already queried, validated and typed. **No live outcome uses either field** — all six come back `null`. So the fields are plumbing with nothing flowing through them. This task writes what flows through.

## What already exists — read it, do NOT change it
- `docs/content/first-exhibit.json`, `docs/content/remaining-exhibits.json` — the live documents, including each outcome's `_id`, `title` and `body`. The voice you must match is in those `body` fields.
- `schemas/outcome.ts` — the validation your output must satisfy:
  - `consequenceTags`: array of 1–4 strings, each matching `/^[a-z0-9-]{2,32}$/`, **unique within an outcome**.
  - `leadsTo`: a reference to one `artifact`.

## The live content you are writing for

| Artifact (slug) | Wing | Choice → Outcome (`_id`) |
|---|---|---|
| The Vending Machine That Sells Extra Mondays (`extra-mondays-vending-machine`) | The Civic Time Expansion Era | "Spend a plan" → A paper Monday drops (`outcome-paper-monday`) · "Keep the weekend intact" → The machine keeps humming (`outcome-soft-refusal`) |
| The Telephone for Calling Roads Not Taken (`roads-not-taken-telephone`) | The Counterfactual Communications Boom | "Call the life you declined" → A familiar stranger answers (`outcome-familiar-stranger`) · "Hang up before it rings" → A missed call arrives from you (`outcome-missed-call-self`) |
| The Umbrella That Remembers Every Storm (`memory-umbrella`) | The Domestic Weather Memory Era | "Open it indoors" → The room rains back (`outcome-room-rains-back`) · "Leave it furled" → The forecast forgets your name (`outcome-forecast-forgets`) |

## Deliverable
One new file: **`docs/content/chain-outcomes.json`**

```json
{
  "outcomes": [
    {
      "_id": "outcome-paper-monday",
      "title": "A paper Monday drops",
      "consequenceTags": ["borrowed-time", "..."],
      "leadsTo": { "artifactId": "...", "slug": "...", "title": "..." },
      "why": "One sentence: why this outcome hands the visitor to that exhibit."
    }
  ]
}
```

Plus a short **`docs/content/chain-outcomes.md`** explaining the walk in plain language: what a visitor experiences moving through it, and why the chain is shaped this way. This is writeup material — write it for a reader who has never seen the site.

## Rules for the tags
- 1–4 per outcome, lowercase, hyphenated, 2–32 characters, unique within the outcome.
- They must read as *consequences to the visitor's future*, not as topic labels. `borrowed-time` is right; `vending-machine` is wrong.
- Tags are the raw material the ticket page (T-010) will compose into a personal "future", so favour tags that combine well across wings. Reuse a tag across outcomes deliberately where two futures genuinely rhyme — that repetition is what will make the ticket page feel composed rather than random.

## Rules for the chain
- Every outcome gets exactly one `leadsTo`.
- **An outcome must never lead back to its own artifact** — no immediate self-loop.
- Across the six outcomes, the chain must let a visitor reach all three wings; do not leave an artifact unreachable.
- Longer cycles (A → B → C → A) are **allowed and expected** — a museum loops. The code handles cycles separately; do not contort the fiction to avoid them. Say in the `.md` where the loops are.

## Forbidden
`schemas/**`, `src/**`, `scripts/**`, `tests/**`, `docs/task-packets/**`, `docs/build-log.md`, `docs/TASK_BOARD.md`, `.env*`, `package.json`, `docs/content/first-exhibit.json`, `docs/content/remaining-exhibits.json`. **Do not call Sanity. Do not publish anything. Do not commit.**

## Acceptance
- `python3 -c "import json;d=json.load(open('docs/content/chain-outcomes.json'));print(len(d['outcomes']))"` prints `6`.
- Every `_id` matches one in the table above; every tag matches `^[a-z0-9-]{2,32}$`; no outcome leads to its own artifact.

## Required output
- the two file paths
- the chain as a readable list (outcome → artifact)
- every tag you invented, grouped by outcome
- anything you could not do, stated plainly
