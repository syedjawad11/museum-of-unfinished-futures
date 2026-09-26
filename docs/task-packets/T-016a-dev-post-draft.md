# T-016a-dev-post-draft

```
ID: T-016a-dev-post-draft
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Draft the DEV submission post for the Sanity Challenge (Path Two, "Vibe-Code Something Strange") from the real build evidence, ready for the founder to review. Nothing is published by this task.

Allowed files:
  docs/submission/dev-post.md       (new; the draft)
  docs/submission/notes.md          (new; open questions, placeholders list, screenshot shot-list)
Forbidden: everything else. Do not edit about.md, the build log, code, or any evidence.

Read first:
  docs/build-log.md (the whole thing — this is the source of truth), docs/content/about.md (approved short-form colophon; the post can go deeper but must not contradict it), docs/workflows-spike.md, imp.md §6, README.md (setup steps, env var names), schemas/ (to describe the content model accurately), docs/TASK_BOARD.md.
  /home/shah20/Desktop/Hermes/planning/sanity-challenge/CHALLENGE_PLAN.md §10 "Submission package" checklist.

Requirements:
  - Use exactly these top-level headings, in this order: What I Built, Demo, Code, My Build Process, Sanity Project Details, Agent Session.
  - Target a 9–14 minute read. Plain, warm, specific; the museum's voice may appear in "What I Built" but the build story is factual. English.
  - What I Built: the strange idea (a museum of inventions from futures that never happened), the visitor walk (exhibit → choice → ending → door to the next exhibit → ticket), six exhibits in three wings.
  - Demo: placeholders only — {{DEMO_URL}}, {{VIDEO_URL}}, and a shot list of 6–8 screenshots as {{SCREENSHOT: description}} markers (evidence/ already holds candidates; name the file if one fits).
  - Code: https://github.com/syedjawad11/museum-of-unfinished-futures, how to run it (from README), env var NAMES only, credits (fonts with OFL licences in src/fonts/, original SVG plates).
  - My Build Process: the real story with real failures and course corrections from the build log (Turbopack→Webpack, the server-import bug in sanity.config.ts if the log records it, the reviewer-found publish-validation bypass, the .netlify lint timeout, hollow tests caught by mutation proofs, "Your trace carries carrying", the strong-reference publish failure, the Workflows spike and why the custom gate stays alongside it). Disclose every tool the log names: an earlier Hermes-orchestrated phase using OpenAI Codex (gpt-5.5 / gpt-5.6-sol), then Claude Code (Claude Opus 5.5) as orchestrator with Codex gpt-5.5 builders, Claude Sonnet 5 designers/builders, a Claude Opus writer, and cross-family reviewers. Include one or two short, real task-packet excerpts as "prompts that worked" (quote from docs/task-packets/). Include test outcomes (latest numbers in the build log) and honest limitations/what was cut (the optional App SDK "Curator's Desk" was cut for time — mark this {{CONFIRM: Curator's Desk cut}}).
  - Sanity Project Details: project ID wa27n68e, dataset production_1 (public read), a public query URL example (https://wa27n68e.apicdn.sanity.io/v2026-09-20/data/query/production_1?query=...), one or two real GROQ queries copied from src/content/ (cite the file), the content model (era, artifact, outcome with choices/consequenceTags/leadsTo, artifactReview) with a small text or mermaid diagram, the custom review gate and the official Workflows definition (stages, the refused empty-reason change request from evidence/T-013/live-demo.txt).
  - Agent Session: a placeholder paragraph {{AGENT_SESSION_URL}} saying which session will be uploaded (the Claude Code orchestration session), redacted.
  - Never invent numbers, dates, quotes, links or features. Every factual claim must be traceable to a file you read; add an HTML comment block at the end mapping claims to sources (as about.md does). No secrets, no personal email, no mention of prize money or judges.
  - notes.md: every placeholder, every {{CONFIRM}}, the screenshot shot-list, and anything you were unsure of.

Acceptance: the orchestrator reads the whole draft against the build log. Required output: file paths, word count, the list of placeholders/confirms, and any claims you could not source (left out).
Limits: 45 minutes. Model: content-writer (Opus).
```

## Worker report
content-writer (Opus). docs/submission/dev-post.md (~4,400 words incl. code blocks) + notes.md. Placeholders: front matter, DEMO_URL, VIDEO_URL, AGENT_SESSION_URL, 8 screenshots (3 need recapture, 1 new Studio capture). Confirms: template intro, final test numbers, Curator's Desk cut, query URL, session redaction.

## Acceptance note
Sep 26, orchestrator read the whole draft against the build log: accurate, well-sourced, honest. Draft accepted; stays REVIEW until the founder reads it and the placeholders are filled after go-live.
