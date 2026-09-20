Review the current uncommitted Museum of Unfinished Futures Sanity integration. Do not edit files, install packages, commit, deploy, mutate Sanity content, or change project settings.

Inspect the actual diff and relevant files. Review for:
- correctness of project `wa27n68e` / dataset `production_1` configuration;
- no token or credential exposure;
- schema quality and reference integrity;
- GROQ correctness, runtime validation, missing/malformed data handling, and public read behavior;
- Next.js 16 and embedded Studio compatibility;
- accessibility and accurate empty-state/status claims;
- dependency/audit claims matching evidence;
- regressions from the earlier local tracer.

Re-run read-only checks where possible: `npm run test:unit`, `npm run sanity:check`, `npx sanity schemas validate`, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`, and inspect `npm audit --audit-level=moderate`. The read-only sandbox may prevent cache/build writes; report that as unavailable rather than a pass.

Return severity-ranked findings with exact file:line references. State whether any critical/high/medium issues remain. Do not approve deployment or content publication.