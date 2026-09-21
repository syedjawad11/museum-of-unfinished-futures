# imp.md — Improvement plan for Museum of Unfinished Futures

Written September 21, 2026 for the founder (plain words first) and for the workers (technical appendix at the end). Contest: DEV × Sanity Challenge, Path Two "Vibe-Code Something Strange". Deadline **October 4, 2026, 11:59 PM PDT**; internal publish target **October 2**. Work is orchestrated by Claude Code per `/home/shah20/Desktop/Hermes/planning/ORCHESTRATION.md`; each item below becomes one or more task packets on `docs/TASK_BOARD.md`.

Priority labels: **Must** = biggest effect on winning, do first. **Should** = strong, do if time allows. **Nice** = only after everything else is green.

---

## What the audit found

### Already good — keep it
1. **Honest, tested engineering.** 25 unit tests + 6 browser tests, type checks, lint, schema validation, a real public Sanity dataset (`wa27n68e` / `production_1`), and a build log with *real* failures and fixes (sandbox couldn't install packages; Turbopack couldn't bind a port so the build uses Webpack; a server-import bug; an independent reviewer found a publish-validation bypass that was then fixed). Judging criterion #1 is "quality and honesty of the build process writeup" — this material is gold.
2. **The writing is genuinely good.** "The Telephone for Calling Roads Not Taken", "The forecast forgets your name" — strange, precise, memorable.
3. **The curator review logic is careful.** Approvals are pinned to an exact draft revision; stale approvals can't publish; validation errors block publish.
4. **Zero spend so far.** Netlify Free site linked; a draft deploy works.

### Why it looks simple and would not win as-is
1. **It looks like a default template.** Arial, the untouched Next.js starter stylesheet, starter icons still in `public/`, no images at all (the "artifact" is a paragraph inside a dark box), the stock black Next.js 404 page. Nothing says "museum" or "strange".
2. **You're done in 60 seconds.** Three exhibits, two links each, one paragraph per link, and every ending is a dead end. Nothing connects to anything.
3. **Not deep enough into Sanity for this contest.** The organizers wrote that entries using the new **Workflows** or the **App SDK** "will stand out from a pile of blog templates" and ask "how deep did you get into Sanity's features? Did you customize the interface?" The app uses neither, nor Functions, images/assets, live updates, or Presentation. The strongest competing entry found (Faux Pas Atlas: 7 content types, 2 official Workflows, 3 Functions, an App SDK dashboard) was built in two days with an AI coding tool. Sanity launched Workflows publicly on September 14, free during beta — this contest is effectively its launch party.
4. **The data model has a loose end.** Every artifact and outcome has a required `era`, but the website never queries or shows it. A judge reading the schema will notice a relationship that does nothing. Choices are hard-locked to exactly 2; outcomes reference nothing; the planned consequence tags and related-artifact links were never built.
5. **Missing basics a judge will trip over.** No custom 404 / error / loading pages (a Sanity hiccup shows Next's generic error screen), no per-exhibit page titles or link-preview images, no header/footer/about page.
6. **"AI-native IDE" wording risk.** Everything so far was built via Hermes/Codex. DEV's Agent Session upload accepts Claude Code, Gemini CLI, Codex, GitHub Copilot CLI and Pi. Doing the improvement work through Claude Code + Codex/Sonnet workers (the new setup) removes that risk and adds an encouraged extra.
7. **Nothing is public yet.** No production deploy, no video, no DEV post draft.

---

## 0. Ground rules
- Keep every existing test green; add tests for each new route or behaviour.
- Keep the build log honest; write down real failures as they happen — they are writeup material.
- $0 spend: Netlify Free, Sanity Free, Workflows beta (Sanity says free during beta — confirm when enabling), App SDK (Dashboard), original SVG art. The founder approves anything public.
- All work runs through the orchestrator and its workers so the session can be uploaded as the contest's "Agent Session".

## 1. MUST — Make it look like a "blueprint night museum" (design) — founder-approved direction
**The idea in one line:** a dark museum after closing time; each invention that was never finished is shown as a glowing engineer's blueprint inside a spotlit glass case, with brass wall plaques and a floor-plan map of the wings.

**Why this style:** blueprints of unfinished inventions match the story; line-art with labels and grids is what code-drawn art does *well* (unlike photo-realism); dark rooms + spotlights + glass are mostly shadows and gradients, so they are cheap; everything is original, so no licence worries and a good line in the writeup. Chosen over AI-generated artwork (consistency and originality risk) and 3D (timeline risk).

Baseline (Must):
- **Design tokens** in `src/app/globals.css`: near-black hall, dim floor, warm spotlight white, glass highlight, brass; one **accent light per wing** from a new `era.accentColor` field (amber = civic time, cyan = communications, violet = weather memory). Dark-only palette; body text contrast ≥ 4.5:1.
- **Typography:** a display serif for titles (e.g. Fraunces) + a technical mono for labels and blueprint annotations (e.g. IBM Plex Mono), self-hosted under `public/fonts/` via `next/font/local` (an earlier build broke when Google Fonts needed network — self-hosting avoids that). Keep licence files alongside.
- **Blueprint plates — one original SVG per artifact.** One shared style spec so all plates look like one museum: 1.5px strokes, faint grid, `fig. 1/2` labels, fake measurements and callout lines, a patent-style number, a title block in the corner, glow via CSS filter. Authored as code, iterated until good, credited as AI-assisted original artwork. Stored as **Sanity image assets** (new `artifact.image` field with required `alt`), rendered from the Sanity CDN inside a `<Vitrine>`; fall back to `public/illustrations/*.svg` + an `illustrationKey` only if SVG serving misbehaves. Budget ~1–1.5 h per plate; the 3 existing exhibits first, new exhibits' plates made alongside their content (§2).
- **Components** (`src/components/`): `Hall` (page background: floor perspective grid, light beams, very light dust-particle canvas that pauses under reduced motion), `Vitrine` (glass case with light cone, holds a plate), `Plaque` (brass wall label: accession no., wing, title, summary), `AccessionTag` ("ACC. 2031-004 · WING II · DO NOT TOUCH"), `WingMap` (SVG floor plan of three wings; visited wings light up from the ticket state in §2), `Doorway` ("Continue to →" styled as a lit exit), `OutcomeProjection` (the outcome appears with a soft projector flicker).
- **Homepage:** museum name in display type over the hall, one line of blurb, the wing map, then exhibits grouped by wing as spotlit vitrines.
- **Exhibit page:** vitrine + plate on one side, plaque with choices on the other; choosing a trace projects the outcome; a doorway leads to the next exhibit; "Back to the hall".
- **Site chrome:** header (museum name, wings, "Your ticket"), footer ("How this museum was built" colophon from §6, repo link, Sanity project ID).
- **Motion, all subtle and gated by `prefers-reduced-motion`:** spotlight brightens on hover, plate glow breathes slowly, outcome flicker-in, wing-map rooms light up. No sound, no autoplay video.
- Museum-voice `not-found.tsx` ("This exhibit was never finished", with an unfinished blueprint), `error.tsx` ("The lights went out in this wing"), `loading.tsx` (a plate drawing itself).
- Per-exhibit `generateMetadata`, `metadataBase`, and a generated `opengraph-image.tsx` per exhibit and for the ticket page — dark card with the plate + title, so links on DEV look intentional.
- Delete the starter SVGs in `public/`; replace `favicon.ico` with a small blueprint mark.
- Guardrails: no 3D/WebGL or heavy animation libraries (CSS + one small canvas); each SVG plate under ~60 KB; Lighthouse performance and accessibility green on mobile.

Stretch (only after §2–§3 are green): per-artifact micro-animation on the three hero plates triggered by the chosen trace (droplets fall upward when "Open it indoors" is chosen; the telephone's dial words rotate; calendar coils turn). Explicitly excluded: a 3D walkthrough.

Files: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/exhibits/[slug]/page.tsx`, `src/app/globals.css`, new `src/components/*`, new `src/app/not-found.tsx` / `error.tsx` / `loading.tsx` / `opengraph-image.tsx`, `schemas/artifact.ts` (`image`), `schemas/era.ts` (`accentColor`), GROQ in `src/content/sanity-repository.ts`, zod in `src/content/sanity-transform.ts`, `public/fonts/`, favicon.

## 2. MUST — Make the visit deeper: from three dead ends to a walk through a museum
- **Wings.** Gallery grouped by era with the era summary as a wall placard; an `/eras/[slug]` page listing that wing's artifacts. (The data already exists — only the query and UI are missing.)
- **Chain outcomes.** Add `outcome.consequenceTags` (strings) and `outcome.leadsTo` (optional reference to another artifact). After an outcome, show "Continue to → The Umbrella That Remembers Every Storm". Content becomes a graph — which is what "structured content" means.
- **Allow 2–4 choices** instead of exactly 2 (`rule.min(2).max(4)`; drop the zod tuple).
- **The visitor's ticket / "Your Unfinished Future".** Encode the visitor's choices in the URL (`/your-future?trace=key1,key2,key3`) — no accounts, no storage, shareable. The page fetches those outcomes from Sanity and composes a short personal "future" from the consequence tags plus one closing line per era, with its own OG image. Every visitor leaves with a different, shareable ending; this is the memorable "strange" hook and helps the reactions tiebreaker.
- **Grow the collection to 6–8 exhibits** (2–3 per era) in the same voice (the original plan already had "a toaster that prints messages from your future self"). Every new exhibit is published **through the real review workflow**, producing genuine evidence for the writeup.
- Update `docs/content/*.json`, the seed/publish approach, Playwright tests (chain, wings, ticket page), and unit tests for the new transform.

## 3. MUST — Beyond the Studio #1: official Sanity Workflows for curation
- **Time-box a 4-hour spike:** install `@sanity/workflow-engine` + `@sanity/workflow-cli` (≥0.33.0, matching versions), write `workflows/exhibit-review.ts` (stages: drafting → curatorial review → approved → on display; a "request changes" transition back to drafting carrying a reason field), `sanity.workflow.ts` bound to `wa27n68e.production_1`, deploy with `npx sanity-workflows deploy` (`--check` first), install the Workflows **Studio plugin** (docs: sanity.io/docs/workflows/studio-plugin) so curators use the real UI.
- **If the spike succeeds:** migrate the curator flow to it and retire the custom `artifactReview` schema + Studio actions in a clean commit. Keep the revision-pinning idea as a workflow condition/guard if the engine supports it; otherwise document the difference honestly. Archive the existing `artifactReview.*` document in the dataset.
- **If the spike fails inside the box:** keep the working custom review and say so plainly in the writeup. Either way the story is honest and interesting ("we built our own state machine; then Sanity shipped Workflows four days before the contest; here is what happened when we migrated").
- Optional visible tie-in: a public "In conservation" strip on the gallery listing titles of artifacts currently in review (public dataset, titles only).

## 4. SHOULD — Beyond the Studio #2: a small App SDK "Curator's Desk"
- Scaffold with `npx sanity@latest init --template app-quickstart` into `apps/curators-desk/` (React 19 + `@sanity/sdk-react`). One screen: every artifact with its workflow stage, number of choices/outcomes, missing image/alt flags, buttons to send to review / approve (through the workflow), and a preview link. Deploy with `sanity deploy` (needs org admin/Developer role — the founder's own org). Judges can't log in, so record it in the video + screenshots.
- Time-box one day. Only start after §1–§3 are green.

## 5. SHOULD — Freshness and a wow moment for the demo video
- Replace `force-dynamic` with ISR (`export const revalidate = 60`) so pages are cached and fast; optionally add one GROQ webhook (Free plan includes 2) hitting a `revalidateTag` route with a secret stored in Netlify env — a measured "publish → visible" story.
- Optional wow: `next-sanity` Live Content (`defineLive`) so the gallery updates *while* the curator approves in the video, no reload. Verify it works for published content on a public dataset without a token before committing to it.

## 6. MUST — The submission itself (judging criterion #1)
- Write the DEV post with the official template headings: What I Built, Demo, Code, My Build Process, Sanity Project Details (project ID `wa27n68e`, public dataset URL, a sample GROQ query), Agent Session. Aim for a 9–14 minute read like the top entries, with 6–8 screenshots/GIFs and a schema diagram.
- Build-process section from the real log: sandbox install failures, Turbopack→Webpack, the `sanity.config.ts` server-import bug, the reviewer-found publish-validation bypass, the `.netlify/` lint timeout, the Workflows migration story, and what was cut. Disclose all tools: Hermes (gpt-5.5 / gpt-5.6-sol via Codex) for the first build, Claude Code (Opus 5 orchestrator) with Codex and Sonnet workers for this phase.
- Upload the improvement session as the Agent Session (redact, then "Make Public").
- Add a public colophon page `/about` ("How this museum was built") with the same honesty in short form, linking the repo.
- 60–90 s video: visitor walk → personal ticket → Studio workflow → Curator's Desk → approve → change visible on the site.
- Production deploy on Netlify (founder authorises), register the production origin in Sanity CORS for `/studio`, then repeat logged-out checks: HTTP, Playwright against production, mobile, `/studio` gate.
- Publish by **October 2**, then reply to every comment honestly (reactions are the tiebreaker; no manipulation).

## 7. NICE — Studio polish and extras (only if time remains)
- Custom desk structure grouping documents by wing/era; artifact previews showing the plate.
- Presentation tool with visual editing (click-to-edit overlays) via `next-sanity`.
- One **Sanity Function** (Free plan includes invocations): on artifact publish, verify every choice's outcome is published and flag gaps; or auto-start the review workflow for new drafts — exactly the organizers' "an agent moves a draft forward, a person approves it" sentence.
- A Studio action using Agent Actions (Free plan: 1000 AI credits/month) to draft a first "curator's label" for a new artifact — build-time AI only, never visitor-facing.
- `sitemap.ts` / `robots.ts`.

## 8. Do NOT do
- No runtime chatbot/LLM for visitors, no accounts, payments, comments, uploads.
- No paid plan, domain, image-generation service, or ads.
- No invented build story; no claiming Workflows/App SDK unless actually shipped.

## 9. Timeline (13 days)
| Dates | Work |
|---|---|
| Sep 22–24 | §1 night-museum design system, components, 3 blueprint plates, chrome, 404/error/loading, metadata/OG |
| Sep 25–26 | §2 schema v2, wings, chaining, ticket page, 3–5 new exhibits with their plates, tests |
| Sep 27–28 | §3 Workflows spike → migrate (or fall back), Studio plugin, publish new exhibits through it, evidence |
| Sep 29 | §4 Curator's Desk (time-boxed to one day), §5 ISR/webhook |
| Sep 30 | Production deploy, CORS, logged-out checks, video, screenshots |
| Oct 1–2 | §6 DEV post, agent session, founder review, **publish** |
| Oct 3–4 | Buffer, fixes, comments; §1 stretch micro-animations only if everything else is done |

If time is short, the cut line is: §1 baseline + §2 + §3 + §6 win more than §4/§5/§7 and the §1 stretch items.

---

## Technical appendix (for workers)
- Next.js 16 project: always read `node_modules/next/dist/docs/` first (the project `AGENTS.md` saying so is genuine Next.js 16 output); keep `next build --webpack` and `NODE_OPTIONS=--no-experimental-webstorage` unless verified otherwise.
- Existing code to reuse: `createSanityExhibitRepository` + `transformSanityArtifact(s)` (`src/content/`), `resolveLinkedOutcome` (`src/domain/visitor-trace.ts`), review domain functions in `src/domain/artifact-review.ts` and `publish-validation.ts` (keep until Workflows is proven), `scripts/sanity-check.mjs`, `scripts/curator-demo.mjs`, Playwright config on port 3100.
- Schema changes: `artifact.image` (image, hotspot, `alt` required), `artifact.choices` min 2 / max 4, `outcome.consequenceTags` (string array, 1–4), `outcome.leadsTo` (reference → artifact, optional), `era.accentColor` (string). Re-run `npx sanity schemas validate` and `npx sanity documents validate`.
- GROQ: add `era->{title, "slug": slug.current, summary, accentColor}`, `image{asset->{url, metadata{lqip, dimensions}}, alt}`, and `outcome->{..., consequenceTags, leadsTo->{title, "slug": slug.current}}`; gallery query grouped by era.
- Workflows: packages `@sanity/workflow-engine`, `@sanity/workflow-cli` (≥0.33.0); `npx sanity-workflows deploy --check` first; `expectedMinReaderModel: 10`; start instances with published IDs only.
- App SDK: `@sanity/sdk-react`, React 19, Node ≥22.12 (host has 26); `sanity deploy` needs an org-level role.
- Free plan limits to stay under: 10k documents, 1M CDN requests/month, 2 public datasets, 2 webhooks, 100GB assets.
- Gates before any deploy or submission: `npm run test:unit`, `npm run test:e2e`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run sanity:check`, `npx sanity schemas validate`, `git diff --check`, secret scan.
