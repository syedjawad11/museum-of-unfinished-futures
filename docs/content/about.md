# How this museum was built

Every building keeps a back room where the plans are stored. This is ours. From here on, the labels only say what happened.

## What this is

The Museum of Unfinished Futures is a small website of made-up inventions from futures that never happened. Six exhibits hang in three wings, two per wing. Each exhibit is a blueprint drawing with a plaque and a choice. Each choice leads to an ending, and each ending opens a door to a different exhibit. The endings you reach become a ticket you can take away.

## How it is made

The site is built with Next.js 16 and Sanity. Exhibits, wings and endings are separate documents that point to one another. An exhibit holds two to four choices; each leads to its own ending, which can carry consequence tags and a link to the next exhibit.

The blueprint plates are original SVG drawings, stored as Sanity image assets, checked for unsafe markup and drawn into the page in each wing's accent colour.

New exhibits go through a curator review flow built into Sanity Studio. A draft is submitted, then approved against that exact revision. It is published only through a guarded action that also waits for Sanity's own validation to pass.

Your ticket lives entirely in the page address (`/your-future?trace=…`). There are no accounts and nothing is stored. The same address always composes the same ticket, so it can be shared.

## Who built it

One founder, directing AI workers. From the evening of September 21, 2026, Claude Code (Claude Opus 5) orchestrated: it wrote a task packet for each job, handed it to a worker and reran the checks itself. Code and scripts came from OpenAI Codex (gpt-5.5). Interface work, the blueprint plates and browser tests came from Claude Sonnet 5 agents. The newer fiction came from a Claude Opus writer. Most work was reviewed by a different model family than the one that built it: Codex gpt-5.6-sol or a Claude reviewer. Before that, a different setup built the first version, including the Sanity connection and the review flow. Deploys waited for the founder's approval.

## What went wrong

- The default Turbopack build failed in the worker's sandbox, which blocked a helper process from opening a port. The build now uses Webpack.
- A reviewer found that the custom publish button checked curator approval but skipped Sanity's schema validation. Publishing now waits for validation to pass.
- On the same day, two workers from two different model families wrote a test that could not fail. Proving that each assertion can fail is now a written step.
- The ticket page once read "Your trace carries carrying…" while every automated check passed. Only reading the page caught it.
- Publishing the three newest exhibits stopped halfway: each review record held a strong reference to its exhibit, and a brand-new exhibit had nothing published to point to. The reference is now weak, and a second run finished the job.

## What is not here

- Only six exhibits.
- The review flow covers exhibits only. Endings were published by a separate, guarded script.
- Every ticket shares one link-preview picture; only the title and description change, because of a limit in this version of Next.js.
- The floor plan on a wing page does not yet light up the room you are in.
- The Sanity command-line and Studio tooling carries 15 known dependency advisories (12 moderate, 3 high). The only automatic fix is an incompatible Sanity downgrade, so it was not applied.

Source code: {{REPO_URL}} · Sanity project ID `wa27n68e`

<!-- sources (all headings refer to docs/build-log.md):
- Six exhibits, three wings, two per wing -> "T-011 — three new exhibits, published through the review flow (Sep 23)" (intro + T-011d)
- Blueprint plate + plaque + choice per exhibit -> "Orchestrated sprint, day 1 — plates in the cases" (T-006); "T-008 — wings"
- Each ending opens a door to a different exhibit -> "T-009 — chained outcomes" (T-009a: "Every ending hands the visitor to a different exhibit"; "no ending returns to its own artifact"); "T-011" (T-011c: 10 leadsTo values set; T-011d: "all seven new doors")
- Endings become a ticket -> "T-010 — the visitor's ticket"
- Next.js 16 -> "Builder Verification" (Next.js 16.3.5 build output); Sanity -> "Live Sanity Read Integration — September 20, 2026"
- Artifact/era/outcome documents pointing to one another -> "Live Sanity Read Integration" (artifact/era/outcome schemas); "T-010" (outcome.era is a required reference)
- 2–4 choices, unique outcome per choice, consequenceTags, leadsTo -> "Orchestrated sprint, day 1 — September 21, 2026 (evening)" (T-003)
- Plates are original SVG, stored as Sanity image assets -> "T-007 — plates into Sanity"; "Orchestrated sprint, day 1" (T-002); "T-011" (T-011b, plate assets on the Sanity CDN)
- Checked for unsafe markup -> "plates in the cases" (T-004 denylist); "T-007" (sanitizePlateMarkup)
- Drawn inline, tinted by wing accent -> "plates in the cases" (T-006)
- Submit -> approve pinned to revision -> guarded publish -> "T-011" (T-011c: "approve (pinned to the draft `_rev`) → guarded publish"); "T-007"
- Publish waits for validation -> "Curator Workflow Final Review — September 21, 2026"
- Ticket in the URL, no accounts, no storage, shareable, deterministic -> "T-010 — the visitor's ticket" (intro + T-010a)
- Claude Code (Opus 5) orchestrates from Sep 21 evening; Codex gpt-5.5 and Sonnet 5 workers -> "Orchestrated sprint, day 1 — September 21, 2026 (evening)"
- Orchestrator writes packets and reruns checks -> same heading ("Packets and acceptance notes"); "Gates re-run by the orchestrator" lines in T-008 to T-011
- Opus writer for the newer fiction -> "T-009" (T-009a), "T-010" (T-010c), "T-011" (T-011a)
- Cross-family review by gpt-5.6-sol or a Claude reviewer -> T-003 and T-007 (Sonnet reviewer), T-006 and T-008 (gpt-5.6-sol), T-009 (Sonnet reviewer), T-011c (Opus reviewer), T-011c2 (gpt-5.6-sol)
- Earlier setup built the first version incl. Sanity connection and review flow -> "2026-09-20", "Supervising Session Verification", "Live Sanity Read Integration", "Curator Workflow Final Review — September 21, 2026" (all before the "Orchestrated sprint, day 1 (evening)" heading, which says Claude Code "now" orchestrates)
- Deploys waited for founder approval -> "Netlify Release Candidate", "Netlify Draft Deployment", "plates in the cases" ("Commit + draft deploy (founder-approved)")
- Turbopack -> Webpack -> "2026-09-20" ("sandbox denied a helper process binding a port")
- Publish-validation bypass -> "Curator Workflow Final Review — September 21, 2026"
- Tests that could not fail, two families, same day, now a written step -> "T-008 — wings" (finding 1 + mutation check); "T-009 — chained outcomes" ("A second test that could not fail")
- "Your trace carries carrying…" -> "T-010 — the visitor's ticket" (grammar defect)
- Strong-reference failure, weak fix, second run -> "T-011" ("Live run 1 stopped part-way", "Resume run: success")
- Review flow covers artifacts only; endings via guarded script -> "T-009 — chained outcomes" ("A corrected assumption about how to publish", T-009c); "T-011" (T-011c step A)
- One link-preview picture, per-trace title/description, Next.js constraint -> "T-010" (Known limitations 1)
- Wing page does not light its own room -> "T-008 — wings" (Known limitations)
- 15 advisories (12 moderate, 3 high), force fix = incompatible downgrade -> "Live Sanity Read Integration" (Dependency audit); "Netlify Release Candidate"
- Project ID wa27n68e -> "Live Sanity Read Integration"
-->
