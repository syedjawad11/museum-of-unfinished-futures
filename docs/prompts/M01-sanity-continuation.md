Continue the interrupted Sanity read-only integration in this repository. Do not commit, deploy, change billing, or publish content.

Read `docs/prompts/M01-sanity-read.md` for the full acceptance criteria, then inspect all partial changes before editing. The previous run was interrupted after creating `src/content/sanity-config.ts`, `src/content/sanity-transform.ts`, its unit tests, and adding `visualDescription` to the domain/fixture. Preserve correct work and complete the remaining requirements.

New verified facts:
- Sanity CLI Google authentication succeeded.
- `npx sanity projects list` shows project `wa27n68e`, name `Competition`.
- `npx sanity dataset list --project-id wa27n68e` shows both `production` and `production_1`.
- The approved target remains `production_1`; its public API query returned zero documents.
- Current unit tests, typecheck, and lint pass (6 tests total).
- `npm audit` currently reports 17 transitive findings (13 moderate, 4 high) from the latest compatible Sanity/Studio dependency graph. Do not use `npm audit fix --force` or silently downgrade incompatible packages. Record this accurately and investigate only safe non-breaking fixes.

Complete strict TDD where behavior remains. Add schemas, Sanity client/repository, embedded Studio if compatible, honest empty-gallery state, real `sanity:check`, README/handoff/build-log updates, and all verification commands. Do not seed or publish content yet. Do not edit raw historical evidence files. Return actual results and blockers.