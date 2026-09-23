# T-012a-about-copy

```
ID: T-012a-about-copy
Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: Write the public "How this museum was built" colophon text for the /about page, short and strictly true to the build log.

Allowed files: docs/content/about.md (new)
Forbidden: everything else; .env*.
Read first: docs/build-log.md (all of it — the only source of facts), imp.md sections on the build-process writeup and /about, docs/TASK_BOARD.md.

Requirements:
  - 350–600 words, plain English, museum-plaque voice allowed in the opening lines only; the rest is plain and factual.
  - Sections (## headings): what this is (one paragraph); how it is made (Next.js 16 + Sanity: content model, curator review flow, blueprint plates stored as Sanity image assets, visitor trace/ticket in the URL — no accounts, no tracking); who built it (a solo founder orchestrating AI workers: Claude Code (Claude Opus) as orchestrator, Codex gpt-5.5 / gpt-5.6-sol and Claude Sonnet workers, earlier Hermes phase — disclose all tools the build log names); what went wrong (3–5 real failures from the build log, one line each, e.g. the strong-reference review failure in T-011, Turbopack→Webpack, the reviewer-found publish-validation bypass); what is not here (honest limits).
  - Every factual claim must be traceable to docs/build-log.md; add at the end an HTML comment block `<!-- sources: ... -->` mapping each claim to the build-log heading it came from.
  - No invented numbers, dates, people, or links. Where the repo link goes, write the literal placeholder `{{REPO_URL}}`.
  - No mention of the contest judges or prizes.
Required output: the file, word count, the claim→source list, anything you could not verify.
Limits: 30 minutes. Model: opus (content-writer).
```
