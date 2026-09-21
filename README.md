# Museum of Unfinished Futures

Next.js visitor experience and embedded Sanity Studio for a fictional museum of futures that never happened.

## What Exists

- A responsive home gallery at `/`.
- A visitor route at `/exhibits/[slug]`.
- A typed Sanity Content Lake repository backed by project `wa27n68e`, dataset `production_1`.
- A domain resolver that maps a selected artifact choice to its linked outcome.
- Sanity schemas for artifacts, eras, and outcomes.
- An embedded Studio at `/studio`.
- An honest empty-gallery state for datasets with no published artifacts.

The local fixture **The Vending Machine That Sells Extra Mondays** remains test/demo recovery data only. Public visitor routes do not fall back to it.

## Local Commands

```bash
npm run dev
npm run test:unit
npm run test:e2e
npm run sanity:check
npm run typecheck
npm run lint
npm run build
npx sanity schemas validate
```

Install the pinned Playwright Chromium bundle once on a new machine with `npx playwright install chromium`. `npm run test:e2e` builds the production application, starts it on `127.0.0.1:3100`, and runs the visitor tests.

## Sanity Status

The application performs real unauthenticated published-content reads from:

- Project: `wa27n68e` (`Competition` in Sanity Manage)
- Dataset: `production_1`
- API version: `2026-09-20`

The dataset was reachable on September 20, 2026 and contains twelve published museum content documents: three eras, six outcomes, and three artifacts. Sanity-managed system documents are not part of this content count. No API token is required for the public read path, and no token belongs in `NEXT_PUBLIC_*` variables.

The Sanity CLI is authenticated through Google on this development machine. Local Studio CORS origins with credentials are configured for `http://localhost:3000` and `http://127.0.0.1:3000`. Start the app and open `/studio`; the browser may require its own Google sign-in.

The founder approved and the project published all three fictional exhibits on September 20, 2026. The reproducible source records are stored at `docs/content/first-exhibit.json` and `docs/content/remaining-exhibits.json`.

## Curator Review Workflow

The embedded Studio includes a small custom review workflow for base `artifact` documents outside Content Release context. It is not Sanity Workflows or Content Releases integration.

Artifact reviews are stored in separate `artifactReview` documents with public-safe fields only: artifact reference, state, submitted/approved draft revisions, a bounded change request reason, and timestamps. They do not store user identity, credentials, email addresses, private notes, raw errors, or visitor-facing workflow metadata.

Curators can use the artifact document actions to:

- Submit the current draft revision for review.
- Request changes with a required public-safe reason.
- Resubmit only after the draft revision changes.
- Approve the currently submitted revision.
- Publish only when the current draft `_rev` matches the approved revision.

The guarded Publish action re-checks the review immediately before calling Sanity's publish operation and surfaces the exact disabled or failure reason. This is a Studio UI guard only: there is a check-to-publish race between the final review read and publish execution, and sufficiently privileged API or administrator mutations can bypass it.

The authenticated demonstration script is intentionally execution-gated. Inspect its dry-run with `node scripts/curator-demo.mjs`; execute it only against the approved configured dataset with `CURATOR_DEMO_EXECUTE=1 npx sanity exec scripts/curator-demo.mjs --with-user-token`. It refuses to run when the selected artifact already has a draft or review record.

## Configuration

Copy `.env.example` to `.env.local` only if overriding the checked-in public defaults. Never add passwords, tokens, or verification codes to repository files.

## Dependency Audit

The safe non-breaking `npm audit fix` was applied. npm still reports 15 transitive findings (12 moderate, 3 high) in the current Sanity 6.15.0 CLI/workbench dependency graph. npm's offered automatic fix downgrades Sanity to 5.14.1, which conflicts with the installed `next-sanity` peer range, so no forced downgrade was applied.
