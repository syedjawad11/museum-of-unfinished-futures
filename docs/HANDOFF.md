# Project handoff

Date: September 20, 2026

## Current state

- Repository: `/home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures`
- Branch: `main`
- Current commit: `a954e26` (`[verified] add published exhibit and Playwright coverage`); the remaining content-pack source, expanded E2E coverage, and record updates are uncommitted.
- M00: founder confirmed registered-only status and private eligibility. Sanity project `wa27n68e` and dataset `production_1` are verified; CLI Google authentication succeeded.
- M01–M03 visitor/content scope is implemented against the live public dataset. Founder-approved publication created three eras, six outcomes, and three artifacts; all six visitor choices resolve without a code redeploy. No deployment or spend occurred.

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

## Verified

- `npm run test:unit`: 11/11 passed.
- `npm run test:e2e`: 6/6 Playwright tests passed against a production build, covering all three artifacts and all six outcomes.
- `npm run sanity:check`: project/dataset read passed; 12 documents and 3 artifacts.
- `npm run typecheck`: passed, including tests.
- `npm run lint`: passed.
- `npm run build`: passed with `/`, `/exhibits/[slug]`, and `/studio/[[...tool]]`.
- `npx sanity schemas validate`: 0 errors and 0 warnings.
- Safe `npm audit fix` applied; 15 transitive Sanity CLI/workbench findings remain because npm's offered force fix is an incompatible Sanity downgrade.
- `git diff --check`: passed.
- Browser automation: the live Sanity-backed gallery displays all three artifacts; every exhibit route and all six linked outcomes render without a code redeploy. Embedded Studio previously loaded to its provider login screen after exact local CORS origins were configured.
- `npx sanity documents validate --yes --level info --format pretty`: 12 valid documents, 0 errors, 0 warnings, 0 info markers.

See `docs/build-log.md` for implementation evidence, `evidence/M01-review.txt` for the fresh-context review, `evidence/M02-first-publication.txt` and `evidence/M03-content-pack.txt` for publication verification, and `evidence/M02-playwright-e2e.txt` for initial automated browser evidence.

## Blockers and next action

- All three founder-approved exhibits and the publish-to-visible checks are complete.
- Automated Playwright coverage includes all three exhibits and all six outcomes.
- Implement and demonstrate the curator workflow before approved hosting and deployment.
- Browser Studio sign-in may still be required even though CLI authentication is complete; credentials and verification codes must not enter chat.

## Authority and cost

- No spending occurred.
- Public CORS configuration was updated only for the two local development origins listed in README.
- The twelve records in the two `docs/content/*.json` files were authorized and published. No additional content publication or public release is authorized by this handoff.
- Do not commit, deploy, create paid resources, or publish the contest entry without founder approval.
