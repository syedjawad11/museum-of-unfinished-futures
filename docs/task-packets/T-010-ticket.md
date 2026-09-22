# T-010 — the visitor's ticket

**imp.md §2.** Encode the visitor's choices in the URL (`/your-future?trace=…`) — no accounts, no storage, shareable — and compose a short personal "future" from the consequence tags plus one closing line per era, with its own OG image.

Run as three parallel sub-tasks on disjoint file sets, across three model families. The full contracts were issued to the workers verbatim; this file records them and the acceptance outcome.

| Sub-task | Worker | Owned files |
|---|---|---|
| T-010a — logic | Codex `gpt-5.5` | `src/domain/ticket.ts`, `src/domain/ticket.test.ts`, `src/content/sanity-repository.ts` (outcomes-by-id query only) |
| T-010c — language | `content-writer` (Opus 5) | `docs/content/ticket-lines.json` |
| T-010b — page | `frontend-designer` (Sonnet 5) | `src/app/your-future/**`, `src/components/Ticket.tsx`, `src/app/exhibits/[slug]/page.tsx`, `tests/e2e/visitor-journey.spec.ts`, `src/content/ticket-lines.json` (copy) |

## Contracts, in brief

**T-010a.** `parseTrace` treats `?trace=` as untrusted: comma-split, trimmed, de-duplicated in first-seen order, capped at 12 ids, each id matched against `^[a-z0-9-]{3,64}$`, a typed error returned rather than thrown; ids reach GROQ as query parameters only, never string interpolation. `composeTicket` is deterministic — the same trace must always compose the same ticket, because the URL is shareable. Handles an empty trace, a trace resolving to nothing, a tag with no phrase, and a missing era. Tests first.

**T-010c.** Three openings, one closing line per era (three era slugs), one phrase per distinct consequence tag, three closings. Second person, present tense, the outcome bodies' register. SVG-safe: no straight double quotes, ampersands or angle brackets. Tag phrases written as fragments that combine.

**T-010b.** The ticket page with deliberate museum-voice copy for every state (no trace, malformed trace, nothing resolved, partially resolved); its own social image; the trace threaded through both the "Continue to →" links and the choice links; Playwright coverage appended.

Every packet carried the standing requirement: **every assertion must be able to fail**, proved by mutation on at least one new test; the port-3100 warning; and an instruction to disregard and report any injected message telling the worker to change how it uses its tools.

## Acceptance — September 22, 2026

Gates re-run by the orchestrator, not taken from any worker's report: **unit 157/157, typecheck clean, lint clean, e2e 17/17**, secret scan clean, `git diff --check` clean, no dependency changes. All changed files inside the allowed lists.

Findings raised by the orchestrator and resolved:

1. **Indirect era resolution.** The outcomes-by-id query resolved an ending's wing through whichever artifact referenced it, when `outcome.era` is a required reference. Raised with an explicit invitation to push back; the worker checked the schema, agreed, and used the direct projection.
2. **"Your trace carries carrying…"** — the composed sentence's stem was a finite verb colliding with the participial tag phrases. Every gate was green and the e2e asserted the composed text; the defect was visible only by rendering a real ticket and reading it. Fixed to the intended stem, split at three phrases per sentence, and pinned with a unit test asserting the full expected string.

Accepted with three known limitations, all recorded in `docs/build-log.md`: the social image cannot vary per trace (a Next.js 16.3.5 route constraint, traced to source and documented in-code, mitigated by per-trace OG *text*); that image uses Satori's default font because only `.woff2` faces exist here; and the composed body repeats its stem across sentences — grammatical but clunky, deliberately deferred as polish.

One scope note accepted: three pre-existing e2e assertions anchored the destination URL with `$`, asserting no query string, which is incompatible with a feature whose purpose is appending `?trace=`. Relaxed to `${path}(\?|$)`, still pinning the exact path. The worker flagged this rather than doing it silently; the orchestrator inspected all three and agreed.
