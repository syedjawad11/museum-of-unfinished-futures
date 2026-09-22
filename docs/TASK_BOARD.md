# Task board — Museum of Unfinished Futures

Orchestrator: Claude Code (Opus 5). Routing and packet template: `/home/shah20/Desktop/Hermes/planning/ORCHESTRATION.md`. Work items come from `imp.md`. One line per task; the full packet, worker report, and acceptance note live in `docs/task-packets/<ID>.md`.

States: BACKLOG → READY → RUNNING → REVIEW → DONE (BLOCKED / CANCELLED as side exits).

| ID | Task | imp.md § | Worker (model) | State | Evidence |
|---|---|---|---|---|---|
| T-000-route-smoke | Prove every delegation route works (Codex gpt-5.5, Codex gpt-5.6-sol, Sonnet builder, Sanity MCP, Netlify MCP) | setup | orchestrator | DONE (Sep 21: Sanity MCP OAuth ok, 3 artifacts; Netlify MCP lists the site; custom roles verified by T-001/T-002) | docs/task-packets/T-000-route-smoke.md |
| T-001-design-foundation | Tokens, fonts, chrome, components, restyled home/exhibit, not-found/error/loading | 1 | frontend-designer (Sonnet) | DONE via T-001b/T-001c (Sep 21; run 1 stopped at ~3% quota, resumed; Codex gpt-5.6-sol review fixes applied; e2e 6/6; commit fdea66e) | docs/task-packets/T-001-design-foundation.md |
| T-001b-design-foundation-resume | Finish T-001: drop root loading.tsx to restore HTTP 404, contrast table, screenshots, report | 1 | frontend-designer (Sonnet) | DONE (Sep 21; review findings fixed in T-001c; screenshots in evidence/T-001/) | docs/task-packets/T-001b-design-foundation-resume.md |
| T-002-blueprint-plate-001 | Plate style spec + first plate (vending machine) | 1 | frontend-designer (Sonnet) | DONE (Sep 21; spec + 15 KB plate + previews; accepted) | docs/task-packets/T-002-blueprint-plate-001.md |
| T-003-schema-v2-content-layer | Schema v2 (accentColor, image, choices 2–4, consequenceTags, leadsTo) + typed content layer + era queries | 1–2 | Codex gpt-5.5 | DONE (Sep 21; 36 unit tests, live 13/13 docs valid, reviewer pass; commit fdea66e) | docs/task-packets/T-003-schema-v2-content-layer.md |
| T-004-plate-markup-loader | Safe inline-SVG plate loader (Sanity asset → local file fallback), tests first | 1 | Codex gpt-5.5 | DONE (Sep 21; 58 tests; reviewer pass-with-fixes, fixes applied + verified) | docs/task-packets/T-004-plate-markup-loader.md |
| T-005-blueprint-plates-002-003 | Plates 002 (umbrella) and 003 (telephone) per spec | 1 | frontend-designer (Sonnet) | DONE (Sep 21; 13 KB each; compass overlap fixed on all 3 plates; renders inspected) | docs/task-packets/T-005-blueprint-plates-002-003.md |
| T-006-plate-wiring | Inline plates + wing accent in Vitrine (home + exhibit), e2e, screenshots | 1 | frontend-designer (Sonnet) | DONE (Sep 21; e2e 7/7; Codex gpt-5.6-sol review pass; commit 0a9a5a6; draft deploy 6ab179225cac95ae144beed3) | docs/task-packets/T-006-plate-wiring.md |
| T-007-plates-into-sanity | Upload the three plates as Sanity image assets and attach them (image + alt) through the review flow with a guarded publish | 1 | Codex gpt-5.5 (script) + orchestrator (run) | DONE (Sep 21; 3 assets 800×600 published via submit→approve→guarded publish; unit 104; e2e 7/7; reviewer pass-with-fixes applied) | docs/task-packets/T-007-plates-into-sanity.md, evidence/T-007/ |
| T-008-wings | Wings: home grouped by era with wall placards, `/eras/[slug]` wing page, WingMap floor plan, e2e | 2 | frontend-designer (Sonnet) | DONE (Sep 22; unit 119; e2e 11/11; Codex gpt-5.6-sol review pass-with-fixes, 3 findings applied; vacuous summary test replaced and mutation-checked) | docs/task-packets/T-008-wings.md, evidence/T-008/ |
| T-009a-chain-content | Consequence tags for all 6 outcomes + the `leadsTo` chain map, as a reviewable JSON proposal (no Sanity writes) | 2 | content-writer (Opus) | DONE (Sep 22; 18 tags, 6 outcomes, all 3 wings reachable, no self-loops; orchestrator-validated against schema rules) | docs/task-packets/T-009a-chain-content.md, docs/content/chain-outcomes.{json,md} |
| T-009b-chain-ui | Consequence-tag strip + "Continue to →" on the exhibit page, with a cycle guard; tests first | 2 | Codex gpt-5.5 | DONE (Sep 22; unit 145; Sonnet reviewer pass-with-fixes, vacuous test replaced) | docs/task-packets/T-009b-chain-ui.md |
| T-009c-apply-chain | Guarded, dry-run-first script applying the approved tags + `leadsTo` to the 6 live outcomes | 2 | Codex gpt-5.5 (script) + orchestrator (run) | DONE (Sep 22; single transaction, per-doc ifRevisionId; 6 documents modified; 0 drafts left) | docs/task-packets/T-009c-apply-chain.md, evidence/T-009/apply-chain-executed.json |
| T-009d-chain-e2e | Browser tests proving the chain end to end now that content is live | 2 | builder (Sonnet) | RUNNING (Sep 22) | docs/task-packets/T-009b-chain-ui.md |

## Backlog (to be turned into packets, in this order; T-007 done on the founder's instruction on Sep 21 night)

| Candidate | imp.md § | Likely worker | Size |
|---|---|---|---|
| T-010: visitor ticket page `/your-future?trace=…` + own OG image | 2 | Codex gpt-5.5 (logic) + frontend-designer (UI) | 1 day |
| T-011: 3–5 new exhibits + outcomes (voice) + one plate each, published through the review workflow | 2 | content-writer (Opus) + frontend-designer (Sonnet) | 1½ days |
| T-012: per-exhibit metadata, opengraph-image, favicon, `/about` colophon, sitemap/robots; vitrine-height cosmetic fix | 1, 6 | frontend-designer / builder (Sonnet) | ½ day |
| T-013: official Sanity Workflows spike (4 h box) → migrate or document | 3 | Codex gpt-5.5, reviewed by reviewer (Sonnet/Opus) | 4 h |
| T-014: App SDK Curator's Desk (1 day box, SHOULD) | 4 | builder (Sonnet) | 1 day |
| T-015: ISR (`revalidate = 60`) + optional webhook revalidation | 5 | Codex gpt-5.5 | small |
| Release: production deploy, logged-out checks, CORS if needed, video, screenshots | 6 | orchestrator with founder approval | ½ day |
| Submission: DEV post draft, public GitHub push, Agent Session upload, publish by Oct 2 | 6 | content-writer (Opus) + orchestrator + founder | 1 day |
