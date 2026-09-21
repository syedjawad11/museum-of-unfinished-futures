# T-000-route-smoke — prove every delegation route

Project: /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures
Objective: confirm each worker route in ORCHESTRATION.md §2 actually runs and reports, before any product task is delegated.
Allowed files: none (read-only tasks). Forbidden: everything else.
Acceptance: each route returns a report naming its model (if visible) and a correct answer to a trivial read-only question about this repository.
Limits: 10 minutes per route, one retry.

## Routes and results

| Route | Result |
|---|---|
| Codex `gpt-5.5`, read-only | PASS — schema types/fields correct (thread 01a0c40f-…) |
| Codex `gpt-5.6-sol`, read-only | PASS — exports + 17 test cases correct (thread 01a0c410-…) |
| Claude Sonnet 5 (general-purpose, model=sonnet) | PASS — scripts, 6 test files, typecheck clean |
| Custom roles in `.claude/agents/` | pending next session (loaded at start-up) |
| Sanity MCP | pending founder OAuth via `/mcp`, then next session |
| Netlify MCP | connected in `claude mcp list`; tool call pending next session |

Orchestrator acceptance: Codex and Sonnet routes accepted 2026-09-21. Remaining three rows re-run at the start of the next session before the first product task.
