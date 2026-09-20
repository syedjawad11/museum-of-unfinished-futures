# Project handoff

Date: September 20, 2026

## Current state

- Repository: `/home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures`
- Branch: `main`
- Scaffold commit: `09b4e2d` (created automatically by Create Next App); all project work after that is uncommitted.
- M00: founder confirmed registered-only status and private eligibility. Sanity project `wa27n68e` and dataset `production_1` are verified; CLI Google authentication succeeded.
- M01 read path is implemented against the live public dataset. The dataset is currently empty, so the visitor UI shows an honest empty state. No deployment, public content publication, or spend occurred.

## Implemented

- Next.js 16.3.5 / React 19.2.8 / TypeScript / Tailwind project.
- Repository-driven exhibit content contract with a `next-sanity` GROQ adapter and runtime validation.
- Gallery and `/exhibits/[slug]` route.
- Sanity schemas for artifact, era, and outcome, plus embedded Studio at `/studio`.
- Local fixture retained only for tests/demo recovery; visitor routes use Sanity without fallback.
- Missing exhibit returns HTTP 404 and `noindex`.
- Unit test, typecheck, lint, production build, audit, and local browser smoke evidence.
- Builder and independent reviewer prompts/results preserved under `docs/prompts/` and `evidence/`.

## Verified

- `npm run test:unit`: 11/11 passed.
- `npm run sanity:check`: project/dataset read passed; 0 documents and 0 artifacts.
- `npm run typecheck`: passed, including tests.
- `npm run lint`: passed.
- `npm run build`: passed with `/`, `/exhibits/[slug]`, and `/studio/[[...tool]]`.
- `npx sanity schemas validate`: 0 errors and 0 warnings.
- Safe `npm audit fix` applied; 15 transitive Sanity CLI/workbench findings remain because npm's offered force fix is an incompatible Sanity downgrade.
- `git diff --check`: passed.
- Browser smoke: live Sanity-backed gallery renders the empty state; embedded Studio loads to its provider login screen after exact local CORS origins were configured.

See `docs/build-log.md` for detailed evidence and `evidence/M01-review.txt` for the fresh-context review.

## Blockers and next action

- Founder approval is required before creating or publishing the first fictional content records in the public dataset.
- After approval, create one era, two outcomes, and one artifact in Studio; publish them and verify they appear on the public gallery without a code redeploy.
- Add route/component E2E coverage, the remaining two exhibits, curator workflow, hosting, and deployment afterward.
- Browser Studio sign-in may still be required even though CLI authentication is complete; credentials and verification codes must not enter chat.

## Authority and cost

- No spending occurred.
- Public CORS configuration was updated only for the two local development origins listed in README.
- No content publication or release is authorized by this handoff.
- Do not commit, deploy, create paid resources, or publish the contest entry without founder approval.
