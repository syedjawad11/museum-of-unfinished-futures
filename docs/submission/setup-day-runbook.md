# Setup day runbook

**When:** Saturday 3 October, ideally. Sunday 4 October still works, but leaves no buffer.
**Hard deadline:** Sunday 4 October, 23:59 PDT, which is **Monday 5 October, 08:59 Malta time**.
**Cost:** nothing. Every step uses a free plan, a free credit allowance or a free download.

Steps marked **(you)** happen in your browser or your accounts. Steps marked **(Claude)** are commands Claude runs after you say "go" in the chat. Never paste a token into the chat.

---

## 1. Give the Clerk something to write with (you, 10–30 minutes)

Do **one** of these. Doing both gives you a backup.

**Option A: Ollama on your Mac (free, offline).**
1. Download the Ollama app from https://ollama.com/download and open it. (Or, in Terminal: `brew install ollama`, then `ollama serve`.)
2. In Terminal: `ollama pull qwen2.5:7b`. This downloads about 5 GB once.
3. Check it: `ollama run qwen2.5:7b "Say hello in five words."` A reply means it works. Leave the Ollama app running.

**Option B: Sanity's free AI credits.**
1. Go to https://www.sanity.io/manage, pick your **organization** (not the project), open **Usage → AI**, and note how many credits are left this month. A demo needs about 5–15.
2. Open **Settings → Spending limits**. Make sure there is **no payment method** and no paid limit, so it can never charge you. If a card is on file, set the limit to the lowest amount or remove the card.

## 2. Make the Clerk's own key (you, 3 minutes)

The Clerk needs its own Sanity key so the workflow history shows *the Clerk* did its moves, not you. It is free.

1. https://www.sanity.io/manage → project **Competition** (`wa27n68e`) → **API** → **Tokens** → **Add API token**.
2. Name: `Acquisitions Clerk`. Permissions: **Editor**. (Not Administrator: the Clerk refuses to run with an administrator token.)
3. Copy the token. In the project folder, create a file called `.env.local` containing:

   ```
   SANITY_CLERK_TOKEN=paste-the-token-here
   CLERK_GENERATOR=ollama
   ```

   Use `CLERK_GENERATOR=sanity` instead if you chose Option B. git ignores `.env.local`, so the token never reaches GitHub.

## 3. Check Studio's Workflows panel (you, 2 minutes)

Follow the six-step checklist under "Founder checklist" in `docs/task-packets/T-018-0-preflight.md`, then tell Claude what you saw.

## 4. Turn on workflow v2 (Claude, after you say go)

```
npx sanity-workflows deploy --deployment production --dry-run
npx sanity-workflows deploy --deployment production
```

The first command only shows the difference from v1. The second adds the curator-only buttons and the "submitted by" field. The old demo run stays on v1. The v1 deploy shared the definition (its structure only, never content or tokens) with Sanity, which is the tool's default. Add `--no-share-defs` if you'd rather not.

## 5. The live agent demo (about 20 minutes; Claude and you take turns)

Have a screen recorder running from here. This is the heart of the video.

1. **(Claude)** Dry run: `npx sanity exec scripts/acquisitions-clerk.ts -- draft "<your one-line idea>" --wing <wing>`. Read the draft together. Wings: `civic-time-expansion-era`, `counterfactual-communications-boom`, `domestic-weather-memory-era`.
2. **(Claude)** The same with `CLERK_EXECUTE=1`. The Clerk creates the draft, starts the review and submits it.
3. **(you)** In Studio (`/studio`), open the new artifact. It should be in **Curatorial review**. Click **Request changes** and write a real note, for example "The second ending is too similar to the first." Take a screenshot.
4. **(Claude)** `CLERK_EXECUTE=1 … -- revise artifact-<slug>`. The Clerk reads your note, revises and resubmits.
5. **(you)** In Studio, read the revision and click **Approve**. Open **Workflow history** and take a screenshot. It shows each move and who made it.
6. **(Claude)** `… --with-user-token -- publish artifact-<slug>`, first as a dry run, then with `CLERK_EXECUTE=1`. This runs on **your** login, because publishing is a curator's job. It publishes the endings and the exhibit together and puts the run "On display".
7. **(you)** Open the live site. The new exhibit appears within about a minute, with its "PLATE PENDING" sheet.

If the Clerk's draft fails its checks twice, it writes nothing and says why. Run step 2 again, or try the other generator.

## 6. Video (you, 30 minutes)

60–90 seconds: walk an exhibit → make a choice → print a ticket → Studio with the Clerk's draft → your change request → the Clerk's revision → approve → the new exhibit on the site. Upload it (YouTube unlisted works) and keep the link.

## 7. Publish the code and the post (Claude, after you say go; and you)

1. **(Claude)** Re-run every check, update the build log with the live run, commit.
2. **(you)** Approve `git push` to GitHub.
3. **(you)** Only if the site code changed since 26 September: in Terminal, `npx netlify-cli login`, then tell Claude to run `npx netlify-cli deploy --build --prod`. Claude then repeats the logged-out checks.
4. **(Claude)** Fill in the post's remaining placeholders from the evidence: the live Clerk run, the final test numbers, the screenshots.
5. **(you)** On DEV: use the challenge's submission template, paste the post, add the tags it requires, add the video link and the Agent Session link, and publish **before Monday 5 October, 08:59 Malta time**.

## If something goes wrong

| Symptom | What to do |
|---|---|
| "Ollama is not reachable" | Open the Ollama app, or run `ollama serve` in Terminal. |
| "Pull the model first" | `ollama pull qwen2.5:7b` |
| HTTP 429 or 402 from Sanity | The free credits are used up. Switch to `CLERK_GENERATOR=ollama`. |
| "SANITY_CLERK_TOKEN belongs to an administrator" | Make a new token with the **Editor** role. |
| "The review gate refuses" during publish | Run `CLERK_EXECUTE=1 … -- sync artifact-<slug>`, then publish again. If the draft changed after approval, send it back through review. |
| Anything else | Stop and ask Claude. Nothing in this runbook needs to be rushed past an error. |
