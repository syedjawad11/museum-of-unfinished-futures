# The Curator's Desk

A small Sanity App SDK app (`apps/curators-desk/`) that runs in the Sanity Dashboard, outside Studio. One screen lists every exhibit, drafts included, and shows for each one:

- whether it is live, live with unpublished edits, or a draft nobody has published (the Acquisitions Clerk's proposals arrive like this);
- how many choices it has, and how many of its endings are live, still drafts, or missing;
- whether its blueprint plate and the plate's alt text are there;
- where it is in the **Exhibit review** workflow, and the state of the revision-pinned review gate.

Selecting an exhibit opens its live workflow run. The buttons come from the workflow engine's own evaluation for the signed-in person, so a curator sees **Request changes** (with a note) and **Approve**, and the Clerk's token would not. After each move the Desk updates the review gate the same way the Clerk's `sync` does (`src/agents/acquisitions-clerk/sync.ts`). Publishing stays in Studio or the curator's `publish` command.

## Run it

The app uses the repository's own `node_modules`, so there is nothing extra to install.

```sh
cd apps/curators-desk
npm run dev       # opens the app inside the Sanity Dashboard; sign in with your Sanity account
npm run build     # production build into apps/curators-desk/dist
npm run deploy    # puts it in the Dashboard for the organization (needs approval)
```

`run.sh` exists because the Sanity CLI picks the nearest Studio config above the current folder before it looks for an app, so inside this repository it would build the Studio instead. The script mirrors the app and the shared code it imports into a staging folder outside the repository, links the repository's `node_modules`, and runs the CLI there.

If the browser reports a CORS error for `http://localhost:3333`, add that origin with credentials in sanity.io/manage → API → CORS origins. It's free.

## What was verified, and what wasn't

- The Desk's logic (`desk.ts`) has 7 unit tests, mutation-proved.
- Typecheck, lint and a production build pass. The built app loads, logged out, and redirects to Sanity's login without errors of its own.
- The signed-in screen and the workflow buttons were not exercised before setup day, because they need a person signed in to the Dashboard. That check is in `docs/submission/setup-day-runbook.md`.
