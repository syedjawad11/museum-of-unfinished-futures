# Task board — Museum of Unfinished Futures

Orchestrator: Claude Code (Opus 5). Routing and packet template: `/home/shah20/Desktop/Hermes/planning/ORCHESTRATION.md`. Work items come from `imp.md`. One line per task; the full packet, worker report, and acceptance note live in `docs/task-packets/<ID>.md`.

States: BACKLOG → READY → RUNNING → REVIEW → DONE (BLOCKED / CANCELLED as side exits).

| ID | Task | imp.md § | Worker (model) | State | Evidence |
|---|---|---|---|---|---|
| T-000-route-smoke | Prove every delegation route works (Codex gpt-5.5, Codex gpt-5.6-sol, Sonnet builder, Sanity MCP, Netlify MCP) | setup | orchestrator | DONE (Sep 21: Sanity MCP OAuth ok, 3 artifacts; Netlify MCP lists the site; custom roles verified by T-001/T-002) | docs/task-packets/T-000-route-smoke.md |
| T-001-design-foundation | Tokens, fonts, chrome, components, restyled home/exhibit, not-found/error/loading | 1 | frontend-designer (Sonnet) | DONE via T-001b/T-001c (Sep 21; run 1 stopped at ~3% quota, resumed; Codex gpt-5.6-sol review fixes applied; e2e 6/6; uncommitted) | docs/task-packets/T-001-design-foundation.md |
| T-001b-design-foundation-resume | Finish T-001: drop root loading.tsx to restore HTTP 404, contrast table, screenshots, report | 1 | frontend-designer (Sonnet) | DONE (Sep 21; review findings fixed in T-001c; screenshots in evidence/T-001/) | docs/task-packets/T-001b-design-foundation-resume.md |
| T-002-blueprint-plate-001 | Plate style spec + first plate (vending machine) | 1 | frontend-designer (Sonnet) | DONE (Sep 21; spec + 15 KB plate + previews; accepted) | docs/task-packets/T-002-blueprint-plate-001.md |
| T-003-schema-v2-content-layer | Schema v2 (accentColor, image, choices 2–4, consequenceTags, leadsTo) + typed content layer + era queries | 1–2 | Codex gpt-5.5 | DONE (Sep 21; 36 unit tests, live 13/13 docs valid, reviewer pass; uncommitted) | docs/task-packets/T-003-schema-v2-content-layer.md |
| T-004-plate-markup-loader | Safe inline-SVG plate loader (Sanity asset → local file fallback), tests first | 1 | Codex gpt-5.5 | DONE (Sep 21; 58 tests; reviewer pass-with-fixes, fixes applied + verified) | docs/task-packets/T-004-plate-markup-loader.md |
| T-005-blueprint-plates-002-003 | Plates 002 (umbrella) and 003 (telephone) per spec | 1 | frontend-designer (Sonnet) | DONE (Sep 21; 13 KB each; compass overlap fixed on all 3 plates; renders inspected) | docs/task-packets/T-005-blueprint-plates-002-003.md |
| T-006-plate-wiring | Inline plates + wing accent in Vitrine (home + exhibit), e2e, screenshots | 1 | frontend-designer (Sonnet) | DONE (Sep 21; e2e 7/7; Codex gpt-5.6-sol review pass; uncommitted) | docs/task-packets/T-006-plate-wiring.md |

## Backlog (to be turned into packets, in priority order)

| Candidate | imp.md § | Likely worker |
|---|---|---|
| T-007: upload plates as Sanity image assets, set artifact.image + alt through the review flow | 1 | orchestrator (MCP) |
| GROQ + wings gallery + /eras/[slug] | 2 | Codex gpt-5.5 |
| Museum-voice not-found / error / loading + metadata + OG images | 1 | builder (Sonnet) |
| Visitor ticket page /your-future | 2 | Codex gpt-5.5 (logic) + frontend-designer (UI) |
| New exhibits (3–5) + plates | 2 | content-writer (Opus) + frontend-designer (Sonnet) |
| Workflows spike (4 h box) | 3 | Codex gpt-5.5, reviewed by reviewer (Sonnet/Opus) |
| App SDK Curator's Desk (1 day box) | 4 | builder (Sonnet) |
| ISR + webhook revalidation | 5 | Codex gpt-5.5 |
| DEV post draft + colophon page | 6 | content-writer (Opus) |
| Production deploy + logged-out checks + video | 6 | orchestrator with founder approval |
