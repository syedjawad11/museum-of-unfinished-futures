---
title: "Museum of Unfinished Futures: an AI clerk proposes, a human curator decides"
published: false
tags: devchallenge, sanitychallenge, sanity, ai
cover_image: https://raw.githubusercontent.com/syedjawad11/museum-of-unfinished-futures/main/evidence/T-021/cover.png
---

*This is a submission for the [Sanity Challenge](https://dev.to/challenges/sanity-2026-09-16), Path Two: Vibe-Code Something Strange*

## What I Built

The Museum of Unfinished Futures is a small museum of made-up inventions from futures that never happened.

There is a vending machine that sells extra Mondays. There is an umbrella that remembers every storm, and a telephone for calling roads not taken. A toaster prints notes from your future self. A switchboard reconnects conversations that ended too soon, at the exact word where they stopped. A kettle brews the weather of past visits.

Each one stands in a case with a blueprint drawing, an accession note (where the museum "got it"), a plaque and a choice. The switchboard's accession note reads: *"Removed intact from the night exchange at Counterfactual Relay Station Four."*

Seven exhibits hang in three wings, each wing lit in its own colour:

- **The Civic Time Expansion Era** (amber): the vending machine and the toaster.
- **The Counterfactual Communications Boom** (cyan): the telephone and the switchboard.
- **The Domestic Weather Memory Era** (violet): the umbrella, the kettle and the doormat, the first exhibit the Acquisitions Clerk drafted (more on that below).

A visit goes like this:

1. **You stand at an exhibit** and read its plaque.
2. **You choose.** The switchboard offers three choices: answer the line that is still lit, pull every cord at once, or plug a cord into the blank jack. The other exhibits offer two.
3. **You reach an ending.** Each choice has its own ending, with short consequence tags beneath it, such as `sentence-finished` or `apology-not-required`.
4. **A door opens.** Every ending says "Continue to →" and sends you to a different exhibit, sometimes in another wing, *because of what you chose*. No ending leads back to its own exhibit. The museum loops on purpose and has no exit.
5. **You take a ticket.** "Print your ticket" turns the endings you reached into a short, personal "unfinished future". The whole ticket lives in the page address (`/your-future?trace=…`). There are no accounts and nothing is stored. The same link always shows the same ticket, so you can share it.

One real ticket, from a walk past the toaster and the kettle, begins: *"Your walk is over. What follows is only what the rooms noticed."*

There is no chatbot and no AI for visitors. All of the strangeness is written content stored in Sanity, and the content model decides where a visitor goes next.

Behind the scenes, new exhibits can arrive through the **Acquisitions Clerk**, an AI agent that works inside Sanity's official Workflows next to a human curator. A curator gives it a one-line brief and a wing. The Clerk drafts an exhibit with two endings, starts an *Exhibit review* run and submits it. The curator reads it in Studio. If they send it back with a note, the Clerk reads the note, revises and resubmits. The Clerk can't approve, put on display or publish; only a person can. It runs on Sanity's free monthly AI credits or on a model running locally through Ollama, so it costs nothing.

## Demo

**Live site, no login needed:** https://museum-of-unfinished-futures.netlify.app

### Try it in two minutes

1. **Enter the hall.** Three wings, seven cases. The newest one, *The Doormat That Knows Who Is Coming* in the violet wing, was drafted by the Acquisitions Clerk and approved by a human curator.
2. **Open the doormat** and choose: wipe your feet and let the house know you, or step over the threshold without being known.
3. **Follow the door.** The ending tells you where to go next, and "Continue to →" takes you there, often into another wing.
4. **Make one more choice**, at the switchboard if you can find it. It is the only exhibit with three.
5. **Print your ticket.** The endings you reached become a short "unfinished future". Copy the address and open it in another browser: the same ticket comes back, because the whole ticket lives in the link.

![The hall: three wings and seven cases, the doormat in the violet wing](https://raw.githubusercontent.com/syedjawad11/museum-of-unfinished-futures/main/evidence/T-021/screens/10-home-seven-exhibits-desktop.png)

![The switchboard after a choice: the ending, its tags and the door to the umbrella](https://raw.githubusercontent.com/syedjawad11/museum-of-unfinished-futures/main/evidence/T-021/screens/04-switchboard-after-choice-desktop.png)

![A visitor's ticket that quotes the Clerk's exhibit](https://raw.githubusercontent.com/syedjawad11/museum-of-unfinished-futures/main/evidence/T-018/screens/09-ticket-with-clerk-exhibit.png)

Behind the glass, in Studio:

![Studio's Exhibit review card after the curator's note: Drafting, round 2, with the reason on the card](https://raw.githubusercontent.com/syedjawad11/museum-of-unfinished-futures/main/evidence/T-018/screens/03-changes-requested-round-2.png)

![Workflow history: the Clerk's moves under its robot id, the curator's under their own name](https://raw.githubusercontent.com/syedjawad11/museum-of-unfinished-futures/main/evidence/T-018/screens/06-history-on-display.png)

![The Clerk's exhibit live on the site](https://raw.githubusercontent.com/syedjawad11/museum-of-unfinished-futures/main/evidence/T-018/screens/08-live-exhibit-after-choice.png)

More screenshots (phone, wing pages, plates at full size) are in [`evidence/`](https://github.com/syedjawad11/museum-of-unfinished-futures/tree/main/evidence) in the repository.

## Code

{% github syedjawad11/museum-of-unfinished-futures %}

### Running it locally

The app reads published content from a public Sanity dataset, so you don't need a token.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The embedded Studio is at `/studio`. It asks you to sign in to Sanity, and your origin must be allowed in the project's CORS settings.

The checks:

```bash
npm run test:unit
npm run typecheck
npm run lint
npm run build
npm run sanity:check
npx sanity schemas validate
npx playwright install chromium   # once per machine
npm run test:e2e                  # builds, serves on 127.0.0.1:3100, runs the browser tests
```

### Environment variables

The public defaults are checked in. Copy `.env.example` to `.env.local` only if you want to point at a different project. Names only:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`

No passwords, tokens or verification codes belong in these, or anywhere in the repository.

### Credits

- **Fonts:** Fraunces (© The Fraunces Project Authors) and IBM Plex Mono, both under the SIL Open Font License 1.1. The licence files sit next to the fonts in `src/fonts/`.
- **Blueprint plates:** six original SVG drawings, one per curator-made exhibit, made for this project. The Clerk's doormat shows a "Plate pending" card for now.
- **Exhibit text:** original fiction.
- Built with Next.js 16 and Sanity (Studio, Content Lake, and the Sanity Workflows early-access packages, version 0.35.0).

## My Build Process

This is the honest version. Everything here comes from the project's build log, task packets and saved evidence, all of which are in the repository.

### Who did the work

One founder, directing AI agents, in two phases.

**Phase one (September 20–21): Hermes directing OpenAI Codex.** An earlier setup, orchestrated by Hermes, used OpenAI Codex `gpt-5.5` to build the first version and `gpt-5.6-sol` as a fresh-context, read-only reviewer. It produced the first three exhibits, the live Sanity connection, the custom curator review flow, and a private draft deploy on Netlify's free plan.

**Phase two (from the evening of September 21): Claude Code as orchestrator.** Claude Code (Claude Opus 5.5) took over. It did not write product code. For each job it wrote a **task packet**: the objective, which files the worker may and may not touch, what to read first, the exact commands that decide pass or fail, and a time limit. It handed the packet to a worker, inspected the result, and **re-ran the checks itself**. A worker's summary was never treated as proof. The workers were:

- **OpenAI Codex `gpt-5.5`** for logic, scripts, schema and tests.
- **Claude Sonnet 5** agents for the interface, the blueprint plates and the browser tests.
- **A Claude Opus writer** for the newer fiction, the endings' tags and the ticket's language.
- **Cross-family reviewers.** Codex `gpt-5.6-sol` reviewed Claude's work, and a Claude reviewer (Sonnet or Opus) reviewed Codex's. The family that built something never reviewed it.

**The final sprint (October 1–4) on a new machine.** Codex wasn't set up on the founder's new MacBook, so the orchestrator built the Acquisitions Clerk itself, under the same rules: tests first, a deliberate break for every new test, and every check re-run before a commit.

Deploys, spending and writes to the live dataset waited for the founder's approval. No money was spent: the Netlify account stayed on the free plan with 0 credits used and no payment method. The founder ruled out paid AI keys entirely, so the Clerk writes with Sanity's free monthly AI credits or with a local model.

### Prompts that worked

The packets were the prompts. Two patterns earned their place.

**1. Tell the worker what already exists.** Before writing the wings packet (T-008), the orchestrator read the code and found that the era queries it needed had shipped, with tests, two tasks earlier. So the packet said:

> ### What already exists — reuse it, do NOT rebuild it
> - `sanityExhibitRepository.listEras()` and `.getEraBySlug(slug)` in
>   `src/content/sanity-repository.ts` — the GROQ already resolves each era with
>   its `exhibits[]` (full artifact projection, including `image` and `choices`),
>   ordered by `title asc`. T-003 shipped these; they are tested.

The same packet looked ahead: "**nothing may assume a wing has exactly one exhibit**. A wing with zero exhibits must render an honest empty line, not crash." When three more exhibits arrived, the wing pages needed no change.

**2. Say what the tests must prove, and make the worker show a test can fail.** From the Sanity Workflows packet (T-013a):

> Tests first: using the engine's in-memory test bench (testing.md), write tests that drive: the happy path drafting→…→on-display; request-changes with a reason returns to drafting and the reason is stored; request-changes WITHOUT a reason is refused; approve/put-on-display are not available from drafting (no skipping); publishing permitted only in `approved` if the engine exposes that verdict. Run RED first (definition stub), then GREEN. Mutation proof: remove the reason requirement, show the refusal test fails, restore.

That last sentence became standard. The story below explains why.

### What went wrong, and what we changed

**The sandbox couldn't install anything.** Codex's builder sandbox has no network. On the first run it couldn't even install the test runner (`npm error code ENOTFOUND … registry.npmjs.org`). The supervising session installed it with normal network access. The first pinned Vitest version (3.2.4) showed a critical security advisory, so it went to 5.0.1. From then on, installs happened outside the worker sandboxes.

**Turbopack → Webpack.** The first production build failed under the default Turbopack bundler, because the sandbox wouldn't let a helper process open a port. The Next.js docs list `next build --webpack` as supported, so the build moved to Webpack. That hit `Could not parse output from TypeScript's --showConfig`, which a documented setting (`experimental.useTypeScriptCli: false`) fixed.

**A server-side import broke the Studio build.** After the embedded Studio was added, the production build failed. A server component imported `sanity.config.ts`, so Webpack picked the server build of a library Sanity depends on (SWR), and that build has no default export. The error trace named `sanity.config.ts` via the Studio page. Loading the Studio and its config through a client component fixed the root cause.

**The publish button skipped validation.** The custom publish action checked that a curator had approved the exact draft, but it no longer waited for Sanity's schema validation. A fresh-context reviewer flagged this as a blocking data-integrity issue. Publishing is now blocked while validation is running, when validation is out of date for the current draft, or when there are errors. A second reviewer passed the fix.

**Smaller ones.**

- A review found that malformed published exhibits would be quietly dropped, so a broken dataset looked empty. It now fails loudly.
- Lint runs timed out because ESLint was crawling Netlify's generated `.netlify/` folder. One ignore rule fixed it.
- A site-wide loading page made a missing exhibit return HTTP 200 instead of 404. The Next.js 16 docs explain why: a root `loading.tsx` starts streaming before `notFound()` runs. We dropped the loading page and kept the real 404.

**Tests that couldn't fail, twice in one day, from two model families.** In the wings task, a Codex reviewer found that a new browser test, written by a Claude agent, checked a wing's subtitle instead of its summary. It would have passed with every summary missing. The same day, a Claude reviewer found this in a Codex-written test:

```ts
expect([].map(formatConsequenceTag)).toEqual([])
```

`.map` never calls its function on an empty array, so the test passes even if the function is deleted. A green rerun can't prove a repair like that, so we deliberately broke one wing summary in the test data, watched the test fail, and restored it. Since then, every packet that includes tests asks the worker to prove that at least one assertion can fail. The rule kept catching things: the first Workflows attempt was rejected because its tests only checked the definition's shape, and a deliberate break in a publish script showed that one of its safety checks was dead code.

**A test run that passed without running.** One end-to-end run reported success while printing `Error: http://127.0.0.1:3100 is already used`. A worker's screenshot server had outlived its task and kept the port, so the suite stopped before running a single test. Our rule now: never accept an exit code without also finding the literal "N passed" line. Separately, undoing that deliberate test breakage with `git checkout --` also wiped a worker's uncommitted edits to the same file. We recovered them from a backup, and the rule now is to back up first and never use `git checkout --` on uncommitted work.

**"Your trace carries carrying…"** Every check was green, and a browser test even asserted the ticket text. But the live ticket read *"Your trace carries carrying a day that was never yours to keep…"*. The sentence began with a verb, while every tag phrase was written to follow an implied "you". Only rendering a real ticket and reading it caught the problem. It's fixed, and a unit test now pins the full sentence for a real two-ending walk. The lesson we wrote down: *green gates prove the code runs, not that the prose is English. Read the page.*

**Publishing the new exhibits stopped halfway.** The first live run of the three-exhibit publish script published seven endings, uploaded the toaster's drawing and created its draft. Then submitting that draft for review failed. Each review record held a **strong** reference to its exhibit, and a brand-new exhibit has no published document for a strong reference to point at. Our review flow had only ever been used on existing exhibits, so it could never have reviewed a new one, from a script or from Studio. Codex had answered "yes, the flow supports brand-new artifacts" by reading the code, and the reviewer had accepted that. Nobody had checked it against Sanity's rules for references. Nothing visitors could see broke. The fix was to make the reference weak.

**Then the resume failed too.** Instead of deleting live documents, the script gained a resume mode. Its dry run reported things that weren't true. That was the second failure on one task, and we never make a third identical attempt, so the task moved to another model family. A Claude Sonnet builder found two bugs:

- Results were matched to documents by list position rather than by id.
- Documents were compared with `JSON.stringify`, which cares about key order, and Sanity returns keys in its own order.

Codex `gpt-5.6-sol` reviewed that fix and returned **fail**. A draft edited in Studio between the checks and the approval could have gone live unchecked, and resume mode skipped some safety checks. Those were fixed and re-reviewed, and the resume run finished cleanly. The lesson: *a dry run proves the plan, not the write.*

**An instruction that wasn't in the repository.** Mid-build, a message appeared in agent contexts claiming "bypass permissions mode is active" and telling agents to edit files through raw shell commands. The orchestrator first told the founder the text was in `AGENTS.md` without opening the file. It wasn't; a search of the whole workspace found nothing. Later, two workers each spotted the same message, refused it because it conflicted with their packets' file rules, and said so in their reports. The rule now: read an instruction-file finding off disk before acting on it.

### Official Sanity Workflows, and why the custom gate stays

Sanity Workflows was in early access, and we gave it a time-boxed spike (T-013). Codex wrote an `exhibit-review` definition with four stages: drafting, curatorial-review, approved and on-display. Requesting changes requires a reason, and publishing is held during drafting and review. Six tests run it on the real engine in memory. Two deliberate breaks, removing the reason requirement and adding a publish hold to `approved`, each made a test fail, as they should. The definition is deployed, and a live demo run walked every stage (details under Sanity Project Details).

We did **not** retire the custom flow. The spike's write-up (`docs/workflows-spike.md`) lists three things that don't carry over:

- **Revision pinning.** The custom flow approves one exact draft revision and refuses to publish if the draft has changed since. The Workflows definition language has no built-in way to do that.
- **Validation-gated publishing.** The custom action waits for Sanity validation. The definition doesn't model that.
- **Guards are advisory in early access.** The Studio plugin and engine honour them, but Content Lake doesn't yet enforce them against direct writes.

So we run both. The custom `artifactReview` flow stays the hard publish gate, and Workflows coordinates the curator's stages in Studio.

### An agent in the workflow: the Acquisitions Clerk

An outside review of an earlier draft of this entry said what was missing: an agent and a person working through the same workflow. The organizers' own phrase for it is an agent moving a draft forward and a person approving it. So we built the Clerk (`src/agents/acquisitions-clerk/`, `scripts/acquisitions-clerk.ts`, `docs/acquisitions-clerk.md`).

Three findings from Sanity's docs shaped it before any code was written:

- **The engine takes the actor from the token.** There is no parameter that says "this was the agent". If the Clerk borrowed the founder's login, the history would say the founder did it. So the Clerk runs on its own Editor robot token.
- **Workflow role checks are advisory.** Sanity says so plainly. We still pinned `request-changes`, `approve` and `put-on-display` to `roles: ["administrator"]`, and the Clerk's own code refuses anything but `submit`, with a test for each. But we don't claim the agent is *unable* to approve; we claim it doesn't, and show where it's stopped.
- **Agent Actions Generate can't fill reference fields** without an embeddings index that is deprecated with no replacement, and an exhibit is mostly references. So the Clerk uses Agent Actions **Prompt**, which returns JSON and writes nothing. The Clerk checks that JSON itself and writes the documents.

The Clerk's draft has to pass the same limits as Studio's schema, and more: every consequence tag must already have a sentence on the visitor's ticket, and an ending may only lead to a published exhibit. A rejected answer goes back to the model once, with the reasons. If it fails again, nothing is written. The endings stay drafts until the curator publishes, so no unreviewed text is ever public.

Each Workflows move is mirrored onto the custom gate, which pins the exact revision. If anyone edits the draft after approval, publishing refuses.

### Outside Studio: the Curator's Desk

To go beyond the Studio, the curator also gets a small App SDK app, the **Curator's Desk** (`apps/curators-desk/`). It runs in the Sanity Dashboard. One screen lists every exhibit, including drafts nobody has published, with what a curator checks first: are all the endings there, is the plate there with its alt text, where is it in review? Selecting an exhibit opens its live workflow run. The buttons come from the workflow engine's own evaluation for the person signed in, and every move also updates the revision-pinned gate.

One surprise: inside this repository the Sanity CLI kept building the Studio instead of the app, because it looks for a Studio config in parent folders before it looks for an app. A small script stages the app outside the repository and runs the CLI there.

The Desk is built and tested (seven unit tests, an app build, and a logged-out load that hands over to Sanity's sign-in), but we didn't capture it signed in for this post.

**The first live run (2 October).** The brief was one line: "A doormat that knows who is coming", for the Domestic Weather Memory wing. The Clerk wrote *The Doormat That Knows Who Is Coming* with Sanity's Agent Actions on the free monthly AI credits. It passed every check on the first answer, and the Clerk submitted it. The curator asked for changes in Studio: *"The two choices are too plain. Make them feel like a decision about being known, for example wiping your feet or stepping over the threshold, and make the second ending as specific and sensory as the first."* The Clerk read that note from the workflow and turned "Step onto the mat" / "Walk around the mat" into **"Wipe your feet and let the house know you"** / **"Step over the threshold without being known"**. It rewrote the second ending around crowded coat hooks, dim entry lamps and rain beading on your sleeves, then resubmitted. The curator approved and published, and the exhibit appeared in the hall within a minute. Its first ending leads on to the Memory Umbrella, and a visitor's ticket now quotes it. The whole run used three AI credits.

Workflow history shows the Clerk's moves under its own robot id (`g-BHx7IW47nZRW`) and the curator's under the curator's own name. It does not add a separate "agent" badge; the engine credits whoever holds the token, which is why the Clerk has its own. The proof is in `evidence/T-018/clerk-*-executed-*.json` and `evidence/T-018/screens/`.

One small blemish we left: the revised choices kept their original keys, so the address bar still reads `?choice=step-onto-the-mat`. Renaming them would have meant another review round for a cosmetic change.

### Test results

The latest numbers the orchestrator re-ran itself:

- **Unit tests: 266/266 passed** (Vitest), including ten behavioural tests of the Workflows definition, 49 for the Clerk and 7 for the Curator's Desk.
- **Browser tests: 77 passed** (Playwright, against a production build).
- **Typecheck and lint:** clean.
- **`npx sanity-workflows deploy --check`:** passed.
- **`npx sanity documents validate`:** 32/32 documents valid after the Clerk's exhibit went live.
- **`npx sanity schemas validate`:** 0 errors, 0 warnings.


### What was cut, and what isn't finished

- **A public "In conservation" strip** listing exhibits under review was cut. Review records, drafts and workflow runs are private in the dataset (an anonymous query counts 0 of each), and the site deliberately reads without a token. Showing them would mean putting a read token on the web server or publishing titles nobody had reviewed yet.
- **Seven exhibits, not more.** We added three by hand instead of five, to leave time for the Workflows spike, and the Clerk added the seventh through review.
- **The review flow covers exhibits only.** Endings were published by separate guarded scripts. Each one runs dry by default, checks every document before writing anything, and writes everything in one transaction that aborts if any document changed in between.
- **The custom publish guard is a Studio guard.** There is a brief gap between its final check and the publish, and anyone with enough API permissions can bypass it.
- **Every ticket shares one link-preview picture.** Only the title and description change, because of a limit in Next.js 16.3.5 that we traced into the framework's source. The preview cards also can't show the plates, because the image renderer can't draw them.
- **A wing's floor plan** doesn't yet light up the room you're in.
- **Dependency advisories.** The Sanity command-line and Studio tooling carries 15 known advisories (12 moderate, 3 high). The only automatic fix is an incompatible Sanity downgrade, so we didn't apply it.

## Sanity Project Details

- **Project ID:** `wa27n68e`
- **Dataset:** `production_1` (public read; the site reads it with no token)
- **API version:** `2026-09-20`

A public query you can open in a browser. It lists the three wings and their accent colours:

```
https://wa27n68e.apicdn.sanity.io/v2026-09-20/data/query/production_1?query=*%5B_type%20%3D%3D%20%22era%22%5D%7Btitle%2C%20accentColor%7D
```

That is `*[_type == "era"]{title, accentColor}`, URL-encoded.

### The content model

Four document types:

```text
                ┌───────────────────────────┐
                │ era (a wing)              │
                │ title, slug, summary,     │
                │ accentColor  (#rrggbb)    │
                └───────────────────────────┘
                   ▲ era (required)      ▲ era (required)
                   │                     │
┌──────────────────┴───────┐        ┌────┴──────────────────────┐
│ artifact (an exhibit)    │ choices│ outcome (an ending)       │
│ title, slug,             │ 2–4,   │ title, body,              │
│ accessionNote, summary,  │───────▶│ consequenceTags [1–4]     │
│ artifactLabel,           │ each to│                           │
│ visualDescription,       │ its own│                           │
│ image + alt (the plate), │ ending │                           │
│ choices[ label, outcome ]│        │                           │
└──────────────────────────┘        └───────────────────────────┘
     ▲             ▲                         │
     │             └──── leadsTo (optional) ─┘
     │ artifact (weak reference)
┌────┴──────────────────────────────────────────┐
│ artifactReview (the custom review gate)       │
│ state, submittedRevision, approvedRevision,   │
│ changeRequestReason, timestamps               │
└───────────────────────────────────────────────┘
```

Why each connection exists:

- **`artifact.era` and `outcome.era`** are required references. The first groups exhibits into wings and tints their plates. The second tells the ticket which wing's closing line to use, directly.
- **`artifact.choices`** holds two to four `{ label, outcome }` pairs. A custom rule rejects two choices pointing at the same ending. Adding a choice in Studio changes the exhibit page with no code change.
- **`outcome.consequenceTags`** holds one to four unique lowercase tags matching `^[a-z0-9-]{2,32}$`. They appear under an ending, and the ticket turns them into sentences.
- **`outcome.leadsTo`** is the "Continue to →" door. It is a strong reference, so a door can't point at an exhibit that doesn't exist. That also forced a publishing order for new exhibits: first the endings without doors, then the exhibits, then all the doors in one guarded transaction.
- **`artifact.image`** is the blueprint plate, with required alt text. The site checks the SVG for unsafe markup and draws it inline so it can take the wing's colour.
- **`artifactReview.artifact`** is a **weak** reference. The halted publish run above is why.

### Real queries from the app

This query, from `src/content/sanity-repository.ts`, returns each wing with its exhibits, found by reverse reference. `artifactProjection` is the full exhibit shape: choices, their endings, and the endings' doors.

```groq
*[_type == "era" && defined(slug.current)] | order(title asc) {
  title,
  "slug": slug.current,
  summary,
  accentColor,
  "exhibits": *[_type == "artifact" && references(^._id) && defined(slug.current)] | order(title asc) ${artifactProjection}
}
```

This one, from the same file, powers the ticket. The ids come from the page address, which can't be trusted. So they are checked against `^[a-z0-9-]{3,64}$`, capped at 12, and passed in as the `$ids` parameter, never pasted into the query text.

```groq
*[_type == "outcome" && _id in $ids] {
  _id,
  title,
  body,
  consequenceTags,
  leadsTo->{
    title,
    "slug": slug.current
  },
  era->{
    "slug": slug.current
  }
}
```

### The custom review gate

The custom gate is a set of document actions on `artifact` in Sanity Studio. A curator can:

1. Submit the current draft revision for review.
2. Request changes, with a required reason.
3. Resubmit, but only after the draft has actually changed.
4. Approve the submitted revision.
5. Publish, but only if the draft's current `_rev` still matches the approved one *and* Sanity's validation has finished with no errors.

Review records hold only public-safe fields: no names, emails or private notes. When the drawings moved into Sanity, and later when the three new exhibits went live, the scripts used this same submit → approve → guarded publish path instead of going around it.

### The official Workflows definition

`workflows/exhibit-review.ts`, deployed to `production_1` as `production.exhibit-review.v1`. Version 2 (`production.exhibit-review.v2`, deployed 2 October) adds the curator-only roles and a `submittedBy` field for the Clerk; the Clerk's first run used it, and the earlier demo run stays on v1.

```text
drafting ──submit──▶ curatorial-review ──approve──▶ approved ──put-on-display──▶ on-display
    ▲                        │
    └──request-changes───────┘   (reason required, 1–500 characters)

Publishing is held in drafting and curatorial-review.
```

In the live demo run on the vending-machine exhibit (`evidence/T-013/live-demo.txt`), the engine refused a change request with no reason, then one with an empty reason:

```text
✖ fire-action error:
  Action "request-changes" on activity "review" rejected: invalid params
    - reason: required but missing

✖ fire-action error:
  Action "request-changes" on activity "review" rejected: invalid params
    - reason: length must be greater than or equal to 1
```

Then it accepted *"Plaque says 'Tuesday' where the machine sells Mondays; fix the date line."* and sent the exhibit back to drafting. The exhibit then went back through review, was approved, and was put on display.

Workflow documents have dotted ids, and Sanity keeps those private even in a public dataset. An anonymous query after the demo returned `[]`, and the exhibit itself was not modified.

<!-- sources (build-log headings refer to docs/build-log.md):
- Six inventions (titles) -> docs/content/first-exhibit.json, remaining-exhibits.json, new-exhibits.json
- Six exhibits, three wings, two per wing; wings of new exhibits -> build log "T-011 — three new exhibits" (T-011a); accents amber/cyan/violet -> "Orchestrated sprint, day 1" (Founder approvals); docs/task-packets/T-008-wings.md "Live wing data"
- Switchboard accession note, three choices, ending, tags, door to umbrella -> docs/content/new-exhibits.json; evidence/T-011/screens/04-switchboard-after-choice-desktop-1280x900.png. Other five exhibits have two choices -> choice label count in first-exhibit.json (2), remaining-exhibits.json (4), new-exhibits.json (7)
- Different exhibit, no self-loops, loops on purpose, no exit, crosses wings -> "T-009 — chained outcomes" (T-009a, T-009d)
- Ticket in URL, no accounts/storage, deterministic, shareable -> "T-010 — the visitor's ticket"; "Print your ticket" and opening line -> evidence/T-011/screens/04-… and 06-ticket-desktop-1280x900.png
- No runtime AI -> imp.md §8 "Do NOT do"; no visitor-facing AI anywhere in the build log
- Run commands, Playwright, port 3100, .env.example, Studio sign-in/CORS -> README.md; `npm install` is not in README (see notes.md)
- Env var names -> .env.example
- Fonts + OFL -> src/fonts/LICENSE-fraunces.txt, LICENSE-ibm-plex-mono.txt; original SVG plates -> "Orchestrated sprint, day 1" (T-002), "plates in the cases" (T-005), "T-011" (T-011b)
- Next.js 16 -> "Builder Verification" (16.3.5); Workflows 0.35.0 -> "official Sanity Workflows (T-013a)"
- Hermes phase, Codex gpt-5.5 / gpt-5.6-sol -> imp.md §6; build log "2026-09-20" through "Netlify Draft Deployment"; README (first three exhibits published Sep 20)
- Claude Code orchestrator from Sep 21 evening and worker roster -> "Orchestrated sprint, day 1 — September 21, 2026 (evening)"; "Opus 5.5" -> docs/content/about.md, T-012a founder answer
- Packet contents -> docs/task-packets/*.md; orchestrator re-runs gates -> "Gates re-run by the orchestrator" lines T-008..T-013a
- Cross-family reviewers -> T-003/T-007/T-009 (Sonnet reviewer), T-001c/T-006/T-008/T-011c2 (gpt-5.6-sol), T-011c (Opus reviewer), T-013a (Claude reviewer)
- Approvals; no money spent; Netlify Free, 0 used credits, no payment method -> "Netlify Release Candidate", "Netlify Draft Deployment", "Orchestrated sprint, day 1" (session quota), "T-009" (T-009c), "T-011" (T-011a)
- Prompt excerpt 1 + "nothing may assume…" -> docs/task-packets/T-008-wings.md lines 18-22, 43-45; no UI change later -> build log T-008 "Forward-compatible with T-011"
- Prompt excerpt 2 -> docs/task-packets/T-013a-workflows-definition.md line 35
- Vitest ENOTFOUND; 3.2.4 critical advisory -> 5.0.1 -> "2026-09-20", "Supervising Session Verification"
- Turbopack -> Webpack, useTypeScriptCli -> "2026-09-20"
- sanity.config.ts / SWR react-server export -> "Live Sanity Read Integration"
- Malformed artifacts misreported as empty -> "Live Sanity Read Integration"
- Publish validation bypass -> "Curator Workflow Final Review — September 21, 2026"
- .netlify lint timeout -> "Netlify Release Candidate"
- loading.tsx vs 404 -> "Orchestrated sprint, day 1" (T-001)
- Hollow tests (T-008 Sonnet-written test found by gpt-5.6-sol; T-009 Codex test found by Sonnet reviewer), mutation check, written step -> "T-008 — wings", "T-009 — chained outcomes"; docs/task-packets/T-010-ticket.md line 21
- Workflows attempt 1 shape-only -> "official Sanity Workflows (T-013a)"; dead-code check -> "T-011" (T-011c)
- Port 3100 false pass; git checkout revert -> "T-008 — wings"
- "Your trace carries carrying" -> "T-010 — the visitor's ticket"
- Strong-reference failure, weak fix, resume, positional zip, JSON.stringify, gpt-5.6-sol fail -> pass, lesson -> "T-011"
- Injected instruction story -> "T-008" (flagged concern), "T-009" (worker refused), "T-010" (two workers)
- Workflows definition, tests, mutations, deploy, run both -> "official Sanity Workflows (T-013a)"; T-013a packet worker report + acceptance note; workflows/exhibit-review.ts; docs/workflows-spike.md
- 203/203, e2e 69, deploy --check -> "official Sanity Workflows (T-013a)"; 28/28 -> "T-011"; schemas 0/0 -> "Curator Workflow Final Review" onward
- Three rather than five -> "T-011" intro
- Endings via guarded scripts -> "T-009" (T-009c), "T-011" (T-011c)
- Studio-only guard, race, privileged bypass -> README.md "Curator Review Workflow"
- One preview picture (Next 16.3.5) -> "T-010" Known limitations; plates not in cards (Satori) -> "T-012 (part 1)" T-012d
- Floor plan -> "T-008" Known limitations
- 15 advisories -> "Live Sanity Read Integration", "Netlify Release Candidate"
- Project ID / dataset / API version -> README.md, .env.example
- Content model -> schemas/era.ts, artifact.ts, outcome.ts (leadsTo weak: false), artifactReview.ts (weak: true)
- outcome.era used by ticket -> "T-010" (orchestrator finding); ticket era closing lines -> docs/task-packets/T-010-ticket.md (T-010c)
- Publish order forced by strong refs -> "T-011" (T-011c)
- Plates sanitised, inline, tinted -> "plates in the cases" (T-004, T-006)
- GROQ -> src/content/sanity-repository.ts lines 75-81, 91-103; parseTrace rules -> "T-010" (T-010a)
- Custom review steps, public-safe fields -> README.md; scripts used the same path -> "T-007", "T-011"
- Workflows demo, refusals, accepted reason, anonymous [] -> evidence/T-013/live-demo.txt; dotted ids private -> docs/workflows-spike.md; exhibit unmodified -> T-013a acceptance note
-->
