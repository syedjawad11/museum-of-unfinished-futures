# T-012c-ticket-stem

```
ID: T-012c-ticket-stem
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Stop the ticket repeating "You leave here" when a visitor's tags span more than one sentence.

Allowed files: src/domain/ticket.ts, src/domain/ticket.test.ts
Forbidden: everything else (ticket-lines.json, components, e2e, .env*). No network. Do not commit.
Read first: src/domain/ticket.ts (formatTagSentences around :228-240, MAX_TAG_PHRASES_PER_SENTENCE), src/domain/ticket.test.ts (expectations at :184 and :326 currently encode the repetition), src/content/ticket-lines.json.

Rule: the first sentence keeps "You leave here …". Each later sentence uses a different stem so no stem appears twice in one ticket. Use this fixed ordered list for sentences 2, 3, …: "You also leave", "And somewhere behind you, you are still". If that second phrasing reads wrong with the existing phrases (all start with a participle/preposition such as "carrying", "with", "known by", "declining", "amended in"), choose a grammatical alternative and justify it by pasting three rendered examples. Output must stay deterministic for the same trace.
Also guarantee: no doubled words across the stem/phrase boundary (e.g. "carrying carrying"), no "undefined".

Tests first: update the two expectations that encode the repetition and add (a) a test that a 6-tag and a 9-tag trace never repeat a stem, (b) a test over every phrase in ticket-lines.json that each stem + phrase has no doubled word at the boundary. Paste RED then GREEN. Mutation proof: revert the stem choice, show red, restore.

Acceptance (paste raw output): npx vitest run src/domain/ticket.test.ts (RED then GREEN), npm run test:unit, npm run typecheck, npm run lint, git status --short.
Required output: changed files, three example tickets (before/after), raw outputs, limitations, actual model ID if visible.
Limits: 30 minutes, two repair attempts. Sandbox: workspace-write, no network. Model: gpt-5.5 (Codex).
```
