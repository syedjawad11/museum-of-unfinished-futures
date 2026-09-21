# Project handoff

Date: September 21, 2026

## Current state

- Repository: `/home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures`
- Branch: `main`
- Current commit: `52bb72e` (`[verified] publish complete three-exhibit content pack`); the independently reviewed curator workflow implementation, demonstration evidence, validation-gate repair, and approved telephone-summary revision are uncommitted.
- M00: founder confirmed registered-only status and private eligibility. Sanity project `wa27n68e` and dataset `production_1` are verified; CLI Google authentication succeeded.
- M01–M04 visitor, content, and curator scope is implemented against the live public dataset. Founder-approved publication created three eras, six outcomes, and three artifacts; all six visitor choices resolve without a code redeploy. The curator demonstration submitted, rejected, revised, resubmitted, approved, and published one artifact revision. No deployment or spend occurred.

## Implemented

- Next.js 16.3.5 / React 19.2.8 / TypeScript / Tailwind project.
- Repository-driven exhibit content contract with a `next-sanity` GROQ adapter and runtime validation.
- Gallery and `/exhibits/[slug]` route.
- Sanity schemas for artifact, era, and outcome, plus embedded Studio at `/studio`.
- Local fixture retained only for tests/demo recovery; visitor routes use Sanity without fallback.
- Missing exhibit returns HTTP 404 and `noindex`.
- Unit test, typecheck, lint, production build, audit, and local browser smoke evidence.
- Automated Playwright coverage for the visitor journey, invalid choices, missing exhibits, and a mobile viewport.
- Builder and independent reviewer prompts/results preserved under `docs/prompts/` and `evidence/`.
- Sanity CLI configuration and reproducible records are stored in `sanity.cli.ts`, `docs/content/first-exhibit.json`, and `docs/content/remaining-exhibits.json`.
- A custom public-safe `artifactReview` schema, tested transition domain, and artifact-only Studio actions implement submit, request changes, resubmit, approve, and guarded publish.
- The reproducible authenticated curator demonstration is stored at `scripts/curator-demo.mjs` and its evidence at `evidence/M04-curator-workflow.txt`.

## Verified

- `npm run test:unit`: 25/25 passed, including 12 artifact-review transition tests and 2 publish-validation guard tests.
- `npm run test:e2e`: 6/6 Playwright tests passed against a production build, covering all three artifacts and all six outcomes.
- `npm run sanity:check`: project/dataset read passed; 12 documents and 3 artifacts.
- `npm run typecheck`: passed, including tests.
- `npm run lint`: passed with no warnings.
- `npm run build`: passed with `/`, `/exhibits/[slug]`, and `/studio/[[...tool]]`.
- `npx sanity schemas validate`: 0 errors and 0 warnings.
- Safe `npm audit fix` applied; 15 transitive Sanity CLI/workbench findings remain because npm's offered force fix is an incompatible Sanity downgrade.
- `git diff --check`: passed.
- Browser automation: the live Sanity-backed gallery displays all three artifacts; every exhibit route and all six linked outcomes render without a code redeploy. Embedded Studio previously loaded to its provider login screen after exact local CORS origins were configured.
- `npx sanity documents validate --yes --level info --format pretty`: 13 valid application documents, including one artifact review; 0 errors, 0 warnings, 0 info markers.
- Authenticated curator demo: submitted revision `FhaKCniGTxwFh6i6lrjrky`, revised and approved revision `LI671VOuLZTgT1VfbT52Kw`, published successfully, and removed the draft.
- Anonymous API and browser read-back confirmed the approved telephone summary is public without a code redeploy; the review remains `approved` and no draft remains.
- Final fresh-context review initially found that the custom publish action bypassed Sanity's schema-validation gate. The repaired action now blocks running, stale, and error-bearing validation; a second independent review passed with no security concerns or logic errors.

See `docs/build-log.md` for implementation evidence; `evidence/M01-review.txt` for the initial review; `evidence/M02-first-publication.txt` and `evidence/M03-content-pack.txt` for publication verification; `evidence/M02-playwright-e2e.txt` for initial browser automation; and `evidence/M04-curator-workflow.txt` for the curator demonstration.

## Blockers and next action

- All three founder-approved exhibits and the publish-to-visible checks are complete.
- Automated Playwright coverage includes all three exhibits and all six outcomes.
- Curator workflow implementation and the genuine authenticated demonstration are complete.
- Browser Studio sign-in remains unverified because the secure Google-login save was declined; the CLI-authenticated demonstration succeeded without credentials entering chat or repository files.
- The curator slice passed final independent review and all local gates. Obtain founder approval before committing it, then verify approved hosting before preparing deployment.

## Authority and cost

- No spending occurred.
- Public CORS configuration was updated only for the two local development origins listed in README.
- The twelve visitor-content records in the two `docs/content/*.json` files, one public-safe artifact review, and the demonstrated telephone-summary revision were authorized and published. No additional content publication or public release is authorized by this handoff.
- Do not commit, deploy, create paid resources, or publish the contest entry without founder approval.
