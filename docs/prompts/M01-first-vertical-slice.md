You are the builder for Museum of Unfinished Futures. Work only in this repository. Do not commit, deploy, create accounts, or use credentials.

Implement one narrow local visitor tracer slice using strict test-driven development:
1. Inspect AGENTS.md, package.json, and relevant Next.js 16 docs under node_modules/next/dist/docs before editing.
2. Add the minimum test tooling needed (Vitest; Testing Library only if the chosen behavior needs it) and package scripts `typecheck` and `test:unit`.
3. RED: write and run one focused failing unit test for content-driven behavior: given a fictional artifact and a selected choice, the domain function resolves the linked outcome. Record the exact failing command/output in docs/build-log.md.
4. GREEN: add minimal typed domain/content code and one clearly labelled local fixture exhibit (the vending machine that sells extra Mondays) to pass it. The fixture is local demo data, not real Sanity integration.
5. Build a minimal responsive home gallery and `/exhibits/[slug]` visitor route that reads through a content repository interface, shows the artifact, offers two choices, reveals the linked outcome, and handles an unknown slug visibly. Do not add visitor writes or runtime AI.
6. Add focused tests for unknown choice/missing artifact behavior, following RED then GREEN for each behavior. Do not write a broad pile of tests before implementation.
7. Run `npm run test:unit`, `npm run typecheck`, `npm run lint`, and `npm run build`. Save exact final outputs or concise command/result records in docs/build-log.md.
8. Keep styling original, accessible, and simple. Avoid external images/assets.
9. Do not add or claim live Sanity integration because no Sanity account/project exists yet. Document that blocker in README.md and docs/build-log.md.

Return a concise summary of files changed, tests run, and blockers. Do not commit.