You are the builder for the next Museum of Unfinished Futures slice. Work only in this repository. Do not commit, deploy, create accounts, change billing, or request/store secrets.

Known verified facts:
- Sanity project ID: wa27n68e (public configuration)
- Dataset: production_1 (public dataset)
- API query `count(*)` returned HTTP 200 with result 0, so the dataset is reachable and currently empty.
- Dependencies already installed: sanity 6.15.0, next-sanity 13.3.4, @sanity/vision 6.15.0, styled-components, zod.
- CLI authentication is not available yet. Do not attempt mutations or invent content in Sanity.

Implement a real read-only Sanity integration using strict vertical TDD:
1. Inspect AGENTS.md, existing code/tests, and relevant local Next.js/Sanity package docs before editing.
2. Add public environment configuration via `.env.example`; never add a token. It may include the provided project ID/dataset and a pinned API date. Ensure local builds work without committing `.env.local` secrets.
3. Add Sanity schema types for `era`, `outcome`, and `artifact`, with meaningful references, two choices, accessible visual-description fields, required fields, unique slug, and bounded text validation. Add `sanity.config.ts` and an embedded `/studio/[[...tool]]` route if compatible with the installed packages.
4. RED then GREEN: add focused tests for transforming a Sanity artifact query result into the existing `ExhibitArtifact` domain shape, including linked choice/outcome resolution and malformed/missing references. Run each focused test and record expected failure before implementation in `docs/build-log.md`.
5. Add a Sanity-backed repository using `next-sanity` and GROQ. Published public pages must read through this repository, not the local fixture repository. Keep local fixtures only for tests/demo recovery and label them accordingly.
6. Because the verified live dataset is empty, add an accessible empty-gallery state rather than silently falling back to fixtures. Do not claim seeded or published content.
7. Add a deterministic `sanity:check` script that performs a real unauthenticated read and reports project, dataset, document count, and artifact count without printing credentials.
8. Run `npm run test:unit`, `npm run sanity:check`, `npm run typecheck`, `npm run lint`, and `npm run build`. Record exact results in `docs/build-log.md`.
9. Update README and docs/HANDOFF.md with actual status and the remaining authenticated steps: configure local Studio CORS if needed, sign in, create/publish content, and verify it appears without code redeploy.
10. Do not weaken existing 404/accessibility fixes. Do not modify the raw historical evidence files.

Return a concise summary of changed files, real command results, and blockers. Do not commit.