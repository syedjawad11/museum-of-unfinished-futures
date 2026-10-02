# T-018-0 — Final-sprint preflight (Phase 0)

Orchestrator: Claude Code (Opus 5.5), Oct 1 2026, fresh clone on a new MacBook. Codex and `ORCHESTRATION.md` are not on this machine; sprint work goes to Claude subagents under the same packet discipline.

## Baseline gate (Node v26.10.0, after `npm ci`)

| Gate | Result |
|---|---|
| `npm run test:unit` | `Tests  206 passed (206)`, 15 files |
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm run build` (inside `test:e2e`) | ok |
| `npm run test:e2e` | `77 passed (10.6s)` |
| `npx sanity schemas validate` | 0 errors, 0 warnings |
| `git diff --check` | clean (after restoring `evidence/T-011/screens/*.png`, which the e2e run rewrites) |

Observation: the e2e web server logs `Error: The destination stream closed early` (digest 3495461215) several times. No test fails. It looks like streamed responses being aborted when Playwright navigates away. It is not new to this sprint as far as we can tell (it was never logged before), and it was not investigated further.

## Production, logged out (Oct 1, plain curl)

`/` 200, `/about` 200, `/exhibits/memory-umbrella` 200, `/your-future` 200, `/sitemap.xml` 200 (3 wings and 6 exhibits listed), `/studio` 200 (HTML only; CORS not yet verified). The founder had already turned Netlify protection off. `/` is served with `cache-status: "Next.js"; hit` (ISR working).

Public dataset read: `count(*[_type=="artifact"])` = 6 on `wa27n68e/production_1`, anonymous apicdn.

## Access on this machine

- Sanity CLI: **not logged in**. No `.env.local`. No writes, workflow deploys or `sanity deploy` are possible until the founder logs in.
- Netlify: no CLI, no MCP. Deploys go through the founder.
- `docs/reference/` is gitignored, so the saved docs were missing. Re-fetched on Oct 1 from `https://www.sanity.io/docs/<page>.md`: 39 Workflows pages into `docs/reference/sanity-workflows/`, plus Agent Actions, App SDK, Live and Functions pages into `docs/reference/sanity-other/`.

## Findings that shape T-018

1. **Workflows 0.36 shipped Sep 30**; we pin 0.35.0. Its migrations cover the generated runtime, `now()` → `$now` in conditions, and start-filter reads. We use none of these. Stay on 0.35.0 unless the App SDK pieces need 0.36. (Source: `docs/reference/sanity-workflows/release-notes.md`.)
2. **The actor comes from the token.** The engine resolves `kind: person | agent | system` from the calling token; nothing can be passed in to change it. (Source: `actors-and-enforcement.md`, "One token does everything".) So if the Clerk runs with `sanity exec --with-user-token`, every move is recorded as the founder. For the history to show an agent, the Clerk needs its **own robot token**, kept in `.env.local`.
3. **Keeping the Clerk off approve.** An action's `roles` field pins who may fire it (`activities-and-actions.md`, "roles"). Engine verdicts and guards are advisory: "Anyone whose token allows a raw Content Lake mutation can skip the engine." Only dataset access control or custom roles are enforced by the lake. Plan: `approve` and `put-on-display` get `roles: ["administrator"]`, the Clerk's robot token gets a lower role, and a unit test covers the Clerk code too. The docs will say plainly that this is advisory.

## Founder checklist: Studio Workflows panel (about 2 minutes)

1. Make sure the CORS origin `https://museum-of-unfinished-futures.netlify.app` exists with **Allow credentials** (Sanity Manage → API → CORS origins).
2. Open `https://museum-of-unfinished-futures.netlify.app/studio` and log in.
3. Open Artifact → *The Vending Machine That Sells Extra Mondays*. Above the form there should be a **workflow strip** with an "Exhibit review" card and its stage (the T-013 demo run ended in *On display*).
4. Open the **Workflows** view (document tab), then the card's overflow menu → **Workflow history**. You should see submit → request changes (with a reason) → submit → approve → put on display.
5. Open a different artifact. You should see a **Start Exhibit review** button. Don't press it.
6. Open the **Workflows** tool (top bar) → Overview. It should list the run.

Founder report (Oct 2, signed in on production /studio): all six steps OK. Screenshots show the Vending Machine with "Exhibit review ✓ On display" above the form, and the Umbrella with a "Start workflow" button and no run. Studio runs fine after the sdk-react 3.5.0 change.

## Update, Oct 1: founder logged in to the Sanity CLI

`sanity debug` shows Syed Jawad (Google login), with the **Administrator** role on project `wa27n68e` ("Competition"). Read-only checks with that login: `production_1` has 0 drafts; the deployed definition `production.exhibit-review.v1` and one instance `production.wf-instance.a7f0811d53de` (the T-013 demo run) are present. No writes were made.

## Update, Oct 1: production CORS origin verified

`sanity cors list` includes `https://museum-of-unfinished-futures.netlify.app`. A preflight `OPTIONS` to `wa27n68e.api.sanity.io` with that Origin returns `204`, `access-control-allow-origin: https://museum-of-unfinished-futures.netlify.app` and `access-control-allow-credentials: true`.
