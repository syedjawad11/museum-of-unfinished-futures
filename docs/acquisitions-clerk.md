# The Acquisitions Clerk

An agent that proposes new exhibits. A curator gives it a one-line brief and a wing. The Clerk writes a draft exhibit with two endings, starts an **Exhibit review** workflow run on it, and submits it. When the curator sends it back with a note, the Clerk reads the note, revises the draft, and submits again. The Clerk can never approve, put on display or publish. A person does those.

It costs nothing to run. The writing comes from one of two free sources:

| `CLERK_GENERATOR` | What it is | Cost |
|---|---|---|
| `sanity` | Sanity Agent Actions **Prompt** | 1 AI credit per request, from the organization's free monthly allowance. Set a spending limit so it can never bill. |
| `ollama` | A model running on this Mac through [Ollama](https://ollama.com) (default `qwen2.5:7b`) | Free and offline. Needs a one-time download of about 5 GB. |

No Anthropic, OpenAI or other paid key is used anywhere. The unit tests use a fake generator and never touch the network.

## How one exhibit moves

```
curator brief ──► Clerk drafts (drafts only, nothing public)
                  Clerk starts an exhibit-review run, fires submit
                         │
                         ▼
               Curatorial review (Studio) ── curator: Request changes + note
                         │                              │
                         │                              ▼
                         │                   Clerk: revise → submit again
                         ▼
               curator: Approve (Studio)
                         │
                         ▼
               curator: publish command (endings + exhibit in one transaction,
                        only if the approved revision is still the draft)
                         │
                         ▼
               On display ── the site shows it within about a minute
```

Two records move together:

- **The workflow run** (`exhibit-review`, official Sanity Workflows) is the conversation. It has the stages, the curator's buttons, the reason for every change request, and the history of who did what.
- **The review gate** (`artifactReview.<id>`, ours, from T-007) is the lock. It pins the exact draft revision that was submitted and approved. Publishing refuses if the draft changed after approval. The Clerk mirrors every workflow move onto it (`sync`).

## Who may do what

| Move | Clerk (Editor robot token) | Curator (Administrator) |
|---|---|---|
| Draft, revise | ✓ | ✓ (in Studio) |
| `submit` | ✓ | ✓ |
| `request-changes`, `approve`, `put-on-display` | ✗ | ✓ |
| Publish | ✗ | ✓ (`publish` command, or Studio after publishing the endings) |

The Clerk is stopped in three places: its own code refuses anything but `submit` (`src/agents/acquisitions-clerk/decide.ts`), the workflow definition pins the human actions to `roles: ["administrator"]`, and its token is an Editor token. The first two are advisory: Sanity says plainly that the workflow engine's role checks guide cooperating callers and are not a security boundary. The Clerk refuses to start if its token turns out to be an administrator's.

## Commands

All commands are dry runs unless `CLERK_EXECUTE=1`. Each run writes a JSON record to `evidence/T-018/`, including the exact prompt and the generator's answer.

```sh
# Draft a new exhibit and submit it for review
CLERK_GENERATOR=ollama CLERK_EXECUTE=1 \
  npx sanity exec scripts/acquisitions-clerk.ts -- draft "A doormat that knows who is coming" --wing domestic-weather-memory-era

# After a curator clicks "Request changes" in Studio
CLERK_GENERATOR=ollama CLERK_EXECUTE=1 \
  npx sanity exec scripts/acquisitions-clerk.ts -- revise artifact-<slug>

# Mirror Studio moves onto the review gate (also runs automatically after each Clerk move)
CLERK_EXECUTE=1 npx sanity exec scripts/acquisitions-clerk.ts -- sync artifact-<slug>

# Where is it, and what would the Clerk do next? (read-only)
npx sanity exec scripts/acquisitions-clerk.ts -- status artifact-<slug>

# The curator's step, on the curator's own login, after approving in Studio
CLERK_EXECUTE=1 npx sanity exec scripts/acquisitions-clerk.ts --with-user-token -- publish artifact-<slug>
```

Wings: `civic-time-expansion-era`, `counterfactual-communications-boom`, `domestic-weather-memory-era`.

Settings (in `.env.local`, which git ignores):

| Variable | Meaning |
|---|---|
| `SANITY_CLERK_TOKEN` | The Clerk's own robot token, **Editor** role. Required for any write. |
| `CLERK_GENERATOR` | `sanity` or `ollama`. (`file` replays a saved answer for dry-run rehearsals and refuses `CLERK_EXECUTE=1`.) |
| `CLERK_OLLAMA_MODEL` | Optional, default `qwen2.5:7b`. |
| `CLERK_OLLAMA_URL` | Optional, default `http://localhost:11434`. |

## What the Clerk checks before it writes anything

The generator's answer must pass `validate.ts`, which mirrors the Studio schema limits: title 3–100 characters, summary 40–320, exactly two choices, endings 30–520 characters, 1–4 consequence tags. Every tag must already have a phrase on the visitor's ticket (`src/content/ticket-lines.json`), so a new exhibit never prints a blank line on someone's ticket. An ending may lead on only to a published exhibit. If the answer fails, the Clerk sends the reasons back to the generator once. If it fails again, the Clerk writes nothing.

New exhibits arrive without a blueprint plate. The exhibit page shows its "PLATE PENDING" sheet until a plate is attached.

## Known limits

- Workflow role checks are advisory (see above). An Editor token can still write and publish through the raw API, so what keeps the Clerk from publishing is its own code and the review gate, not Sanity permissions. A hard limit would need a custom role that cannot write published documents, which the project's plan does not offer.
- The gate pins the exhibit's revision. The endings are checked separately: `publish` refuses if an ending draft changed after approval.
- In Studio, the guarded **Publish** works only after the two endings are published, because the exhibit's choices point at them. The `publish` command publishes all three together.
- On the in-memory test bench every actor is recorded as a person. In production the engine takes the actor's kind from the calling token, so whether the history shows the Clerk as an "agent" is checked on the first live run, not assumed.
