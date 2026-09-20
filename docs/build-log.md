# Build Log

## 2026-09-20

- M02 Sanity read slice inspected `AGENTS.md`, current content/domain code, tests, README/HANDOFF, local Next App Router docs under `node_modules/next/dist/docs`, and installed Sanity package docs/readmes/type declarations for `next-sanity`, `sanity`, and `@sanity/vision`.
- RED, focused Sanity transformer test before implementation:

```text
$ npm run test:unit -- src/content/sanity-transform.test.ts
FAIL  src/content/sanity-transform.test.ts
Error: Cannot find module './sanity-transform' imported from /home/shah20/Desktop/Hermes/projects/museum-of-unfinished-futures/src/content/sanity-transform.test.ts
Test Files  1 failed (1)
Tests  no tests
```

- Inspected `AGENTS.md`, `package.json`, and local Next 16 docs under `node_modules/next/dist/docs`, including App Router project structure, layouts/pages, dynamic routes, accessibility, and Vitest setup.
- Attempted to install Vitest:

```text
$ npm install -D vitest
npm error code ENOTFOUND
npm error syscall getaddrinfo
npm error errno ENOTFOUND
npm error network request to https://registry.npmjs.org/vitest failed, reason: getaddrinfo ENOTFOUND registry.npmjs.org
npm error network This is a problem related to network connectivity.
npm error network In most cases you are behind a proxy or have bad network settings.
npm error network
npm error network If you are behind a proxy, please make sure that the 'proxy' config is set properly.  See: 'npm help config'
npm error Log files were not written due to an error writing to the directory: /home/shah20/.npm/_logs
npm error You can rerun the command with `--loglevel=verbose` to see the logs in your terminal
```

The builder sandbox could not install Vitest. The supervising session later installed it successfully with normal project network access and updated `package-lock.json`.

- RED, initial outcome-resolution test:

```text
$ npm run test:unit

> museum-of-unfinished-futures@0.1.0 test:unit
> vitest run

sh: 1: vitest: not found
```

- GREEN attempt after adding resolver and local fixture was also blocked by missing Vitest:

```text
$ npm run test:unit

> museum-of-unfinished-futures@0.1.0 test:unit
> vitest run

sh: 1: vitest: not found
```

- Added focused unknown-choice and missing-artifact tests. Their initial execution was blocked at the runner level until Vitest was installed by the supervising session.
- First `npm run build` after removing Google Fonts still failed under default Turbopack because the sandbox denied a helper process binding a port. Local Next CLI docs list `next build --webpack` as a supported build option, so the build script now uses Webpack.
- Webpack build initially failed with `Could not parse output from TypeScript's --showConfig.` Local Next docs document `experimental.useTypeScriptCli: false`; app `typecheck` already passes through `tsc`, so build now uses the TypeScript JS compiler API.

## Builder Verification

```text
$ npm run test:unit

> museum-of-unfinished-futures@0.1.0 test:unit
> vitest run

sh: 1: vitest: not found
```

```text
$ npm run typecheck

> museum-of-unfinished-futures@0.1.0 typecheck
> tsc --noEmit -p tsconfig.typecheck.json
```

Result: passed.

```text
$ npm run lint

> museum-of-unfinished-futures@0.1.0 lint
> eslint
```

Result: passed.

```text
$ npm run build

> museum-of-unfinished-futures@0.1.0 build
> next build --webpack

▲ Next.js 16.3.5 (webpack)
✓ Running next.config.ts took 29ms
- Experiments (use with caution):
  ⨯ useTypeScriptCli

  Creating an optimized production build ...
✓ Compiled successfully in 6.5s
  Running TypeScript ...
  Finished TypeScript in 3.1s ...
  Collecting page data using 6 workers ...
  Generating static pages using 6 workers (0/5) ...
  Generating static pages using 6 workers (1/5)
  Generating static pages using 6 workers (2/5)
  Generating static pages using 6 workers (3/5)
✓ Generating static pages using 6 workers (5/5) in 882ms
  Finalizing page optimization ...
  Collecting build traces ...

Route (app)
┌ ○ /
├ ○ /_not-found
└ ƒ /exhibits/[slug]


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Result: passed.

- Sanity integration blocker: no Sanity account/project details or credentials exist in this local repo. This slice uses labelled local demo fixture data only.

## Supervising Session Verification

- Installed Vitest with project network access. An initial pinned `3.2.4` install exposed two known audit findings, including one critical advisory, so it was upgraded to `5.0.1`; `@types/node` was updated to satisfy the current peer range.
- Renamed the Vitest config to `vitest.config.mts` to remove the Vite native config-loader warning.

```text
$ npm run test:unit
Test Files  1 passed (1)
Tests       3 passed (3)
```

```text
$ npm run typecheck
Result: passed.

$ npm run lint
Result: passed.

$ npm run build
Result: passed. Routes: /, /_not-found, /exhibits/[slug].

$ npm audit --audit-level=moderate
found 0 vulnerabilities
```

## Review and Repair

- Fresh-context review used `gpt-5.6-sol` in a read-only sandbox; raw findings are preserved in `evidence/M01-review.txt`.
- Fixed both medium findings: unknown exhibit routes now use Next.js `notFound()` and return HTTP 404 with `noindex`; keyboard focus uses a dark, offset outline instead of the low-contrast gold ring.
- Unit-test files are now included in `npm run typecheck`.
- The raw builder summary in `evidence/M01-builder-summary.txt` is intentionally preserved as historical evidence; its Vitest blocker was resolved by the supervising session as documented above.

Final rerun after repairs:

```text
$ npm run test:unit
Test Files  1 passed (1)
Tests       3 passed (3)

$ npm run typecheck
Result: passed.

$ npm run lint
Result: passed.

$ npm run build
Result: passed.

$ npm audit --audit-level=moderate
found 0 vulnerabilities

$ git diff --check
Result: passed.
```

Local HTTP/browser smoke checks:

```text
GET /exhibits/does-not-exist -> 404
Missing page title -> 404: This page could not be found.
Missing page robots meta -> noindex
Gallery -> exhibit -> "Spend a plan" -> linked "A paper Monday drops" outcome verified.
```

## Live Sanity Read Integration — September 20, 2026

- Founder provided public project ID `wa27n68e` and dataset `production_1`.
- Sanity CLI Google authentication completed successfully. No password, token, or verification code entered the repository or chat.
- `npx sanity projects list` verified project `Competition` (`wa27n68e`).
- `npx sanity dataset list --project-id wa27n68e` verified datasets `production` and `production_1`; the approved target remains `production_1`.
- Added exact local Studio CORS origins with credentials for `http://localhost:3000` and `http://127.0.0.1:3000`, then read them back with `npx sanity cors list --project-id wa27n68e`.
- Added pinned Sanity/Studio dependencies, artifact/era/outcome schemas, runtime validation, GROQ repository queries, embedded `/studio`, and a real public-dataset check script.
- Visitor routes now use the Sanity repository without fixture fallback. The verified empty dataset produces an accessible empty-gallery state.
- The local fixture remains only for tests and recovery.

Two builder runs were interrupted during implementation and sandboxed build verification. The transformer/repository/empty-state tests exist and pass, but exact RED output from the interrupted runs was not preserved; do not claim complete RED-output evidence for this slice.

Initial production build failed because the server-component graph imported `sanity.config.ts`, causing Webpack to select SWR's `react-server` export, which intentionally has no default export while Sanity imports SWR's default hook. The failing import trace named `sanity.config.ts` through the Studio page. Moving the Studio/config import behind a client component fixed the root cause. Node 26's experimental Web Storage warning was removed for builds with `--no-experimental-webstorage`.

```text
$ npm run test:unit
Test Files  4 passed (4)
Tests       9 passed (9)

$ npm run sanity:check
projectId: wa27n68e
dataset: production_1
apiVersion: 2026-09-20
documentCount: 0
artifactCount: 0

$ npx sanity schemas validate
Errors:   0
Warnings: 0

$ npm run typecheck
Result: passed.

$ npm run lint
Result: passed.

$ npm run build
Result: passed. Routes: /, /_not-found, /exhibits/[slug], /studio/[[...tool]].
```

Browser/HTTP smoke checks:

```text
GET / -> 200 and visible "No published artifacts yet" state.
GET /studio -> 200 and Sanity provider-login surface after CORS configuration.
```

Dependency audit:

- A safe non-breaking `npm audit fix` removed the direct styled-components/PostCSS findings.
- Remaining result: 15 transitive findings (12 moderate, 3 high) under the latest compatible Sanity 6.15.0 CLI/workbench graph.
- npm's offered force fix downgrades Sanity to 5.14.1, outside `next-sanity` 13.3.4's accepted Sanity range. No force fix or incompatible downgrade was applied.
- No content documents were created or published.

Fresh-context review (`gpt-5.6-sol`) found one medium issue: malformed published artifacts could be silently dropped and misreported as an empty dataset. Two failing regression tests reproduced the problem. `transformSanityArtifacts()` now throws on an unexpected response shape or any malformed published artifact, so the route enters failure handling rather than presenting a false empty state.

The review's low-risk findings were also corrected: `.env.example` is explicitly tracked, `sanity:check` rejects missing/non-integer count fields, and application metadata no longer calls the live integration a local demo.

Post-review verification:

```text
$ npm run test:unit
Test Files  4 passed (4)
Tests       11 passed (11)

$ npm run sanity:check
documentCount: 0
artifactCount: 0

$ npx sanity schemas validate
Errors:   0
Warnings: 0

$ npm run typecheck
Result: passed.

$ npm run lint
Result: passed.

$ npm run build
Result: passed.

$ git diff --check
Result: passed.
```
