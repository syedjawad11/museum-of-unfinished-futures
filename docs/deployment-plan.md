# Netlify deployment plan — Museum of Unfinished Futures

Date: September 21, 2026
Status: hosting approved, CLI authenticated, and manual site created; no deployment has been authorized or executed.
Host: Netlify Free
Deployment mode: manual CLI deployment for the first release

## Verified starting point

- Founder approved Netlify Free on September 21, 2026.
- The project baseline is commit `b511b75`; hosting configuration, release documentation, and the `.netlify/**` ESLint ignore are currently uncommitted.
- The repository has no configured Git remote, so automatic Git-based deployment is not available yet.
- Netlify CLI authentication succeeded for the founder-owned `Museum MVP` team on September 21, 2026.
- Netlify API verification reports an active Free (`credit-free`) plan, owner access, 300 included and 0 used credits, automatic top-up disabled, and no payment method.
- The authorized manual site `museum-of-unfinished-futures` was created and linked locally. Site ID: `d24b8311-81a5-4589-bcc7-68c132ebde2b`; reserved hostname: `https://museum-of-unfinished-futures.netlify.app`.
- Netlify read-back confirms `published_deploy: null`; the reserved hostname does not yet contain a deployed release.
- An isolated local Netlify production build passed using Netlify CLI 27.8.0 and Next.js Runtime 5.16.0.
- No deployment, custom DNS record, paid resource, or spend has been created. The authorized Free account and empty manual site now exist.

## Release strategy

Use a two-stage manual release:

1. Create a draft deploy and test its private preview URL.
2. Promote through a separate production deploy only after the release evidence passes and the founder authorizes public release.

Do not use an anonymous deploy. The site must belong to the founder's approved Netlify Free account so ownership, usage, and deletion controls are clear.

## Phase A — account and repository preparation

1. Authentication is complete. Do not send credentials or tokens through chat.
2. Free-plan verification is complete through the authenticated Netlify API: 300 included credits, 0 used, automatic top-up disabled, and no payment method.
3. Manual site creation is complete without continuous deployment.
4. A tracked `netlify.toml` now contains the tested build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. `.netlify/` is ignored; local site-link metadata is not tracked.
6. The account/team name, site ID, stable hostname, plan, and initial credit balance are recorded without authentication secrets.

Gate: stop if login fails, the account is not Free, billing is required, the plan does not show a hard usage limit, or site creation proposes a paid resource.

## Phase B — release candidate and draft deploy

1. Rerun local release gates:
   - `npm run test:unit`
   - `npm run sanity:check`
   - `npx sanity schemas validate`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run build`
   - `npm run test:e2e`
   - `git diff --check`
2. Confirm that no `.env*`, tokens, credentials, private notes, or generated `.netlify/` files are tracked.
3. Create a Netlify draft deploy; do not use `--prod`.
4. Capture the draft URL, deploy ID, command output, build log URL, and credit balance.
5. Test the draft URL while logged out:
   - Home page loads all three exhibits.
   - All three exhibit pages load.
   - All six choices resolve to the expected outcomes.
   - Missing exhibit returns HTTP 404 and `noindex`.
   - Mobile journey works.
   - `/studio` loads the expected Studio/login surface without exposing privileged content.
6. Check response headers, browser console, server/function logs, and Sanity read behavior.

Gate: no production deployment if any core route fails, a secret appears, the app relies on a local fallback, the Netlify function errors, or the draft consumes an unexpected amount of credits.

## Phase C — production authorization and release

1. Present the draft-deploy evidence to the founder.
2. Obtain explicit public-release authorization.
3. Run a separate production deployment using the already verified release candidate.
4. Read back the exact production URL and deploy ID.
5. Add the exact production origin to Sanity CORS with credentials only if embedded Studio sign-in is required on the public host.
6. Read back the Sanity CORS list to verify the exact origin; do not add a wildcard.
7. Repeat the logged-out visitor tests against the stable production URL.
8. Verify `/studio` separately. Browser authentication is not required for the public visitor release, but the page must not expose private data or break the public app.
9. Record the final Netlify credit balance and confirm no spend occurred.

Gate: the release is complete only when the stable production URL passes the visitor checks while logged out and the deployment is recorded in project evidence.

## Rollback

- Keep commit `b511b75` as the known-good pre-deployment code baseline until a later release is verified.
- If the draft fails, delete or abandon the draft; do not promote it.
- If production fails, restore the previous known-good Netlify production deploy or take the site offline until repaired.
- Content rollback is separate from code rollback. Use the preserved Sanity source records and curator evidence if published content must be restored.

## Evidence to preserve

Create a deployment evidence file containing:

- Netlify CLI and runtime versions.
- Account plan confirmation without billing details.
- Site name, site ID, draft URL, production URL, and deploy IDs.
- Build and deployment timestamps.
- Exact release-gate results.
- Logged-out HTTP and browser checks.
- Sanity CORS change and read-back, if performed.
- Credits before and after each deploy.
- Any failure, correction, rollback, or limitation.

## Current blocker and next action

The Netlify account, Free-plan controls, manual site, and local deployment configuration are verified. A production-mode offline Netlify build packaged the server handler. All local release gates pass: 25 unit tests, Sanity read/schema/document validation, typecheck, lint, production build, six Playwright tests, secret/path checks, and `git diff --check`. The previously documented 15 transitive Sanity CLI/workbench audit findings remain. See `evidence/M05-release-candidate.txt`. The next action is founder review and separate authorization for a draft deployment. Production deployment remains a later, separate gate.
