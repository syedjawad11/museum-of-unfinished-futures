# DEV post draft — notes for the orchestrator (T-016a)

Draft: `docs/submission/dev-post.md`. Nothing is published.

## Placeholders to fill

| Marker | Where | What goes there |
|---|---|---|
| `{{DEV_TEMPLATE_FRONT_MATTER}}` | top of file | The official Path Two template's front matter: title, the challenge's required tags including `#sanitychallenge`, cover image if any. I did not invent tags. |
| `{{DEMO_URL}}` | Demo | Production Netlify URL (no production deploy exists yet; draft deploys return 401 to logged-out visitors). |
| `{{VIDEO_URL}}` | Demo | 60–90 s walkthrough (imp.md §6). |
| `{{SCREENSHOT: …}}` ×8 | Demo | See the shot list below. |
| `{{AGENT_SESSION_URL}}` | Agent Session | Public, redacted Claude Code orchestration session. |

## {{CONFIRM}} markers

1. `{{CONFIRM: exact template intro line and challenge link}}`: the italic opening line is modelled on the usual DEV challenge template but not copied from it. Replace it with the template's exact line and link.
2. `{{CONFIRM: final test numbers after T-015 and any later work}}`: the numbers are the latest in the build log (unit 203/203, e2e 69 passed, from T-013a). T-015 (ISR) is still RUNNING and may change them.
3. `{{CONFIRM: Curator's Desk cut}}`: required by the packet. The build log does not record the cut. TASK_BOARD still lists T-014 in the backlog.
4. `{{CONFIRM: query URL tested logged-out}}`: I built the URL-encoded query by hand and could not run it (no network or shell). Open it logged out and check that it returns three eras.
5. `{{CONFIRM: which session file(s) are uploaded, and that redaction is complete}}`: in Agent Session.

## Screenshot shot list

| # | Shot | Candidate file | Status |
|---|---|---|---|
| 1 | Hall, desktop, three wings / six cases | `evidence/T-011/screens/01-home-desktop-1280x900.png` | Usable. Recapture on production for the final build. |
| 2 | Switchboard before a choice | `evidence/T-011/screens/03-switchboard-before-choice-desktop-1280x900.png` | Usable |
| 3 | Switchboard after a choice (ending, tags, door, "Print your ticket") | `evidence/T-011/screens/04-switchboard-after-choice-desktop-1280x900.png` | **Recapture.** I looked at it: the SELECTED badge runs into the choice label, which T-012b fixed. |
| 4 | Wing page with floor plan | `evidence/T-008/wing-desktop.png` | **Recapture.** Taken when each wing held one exhibit. |
| 5 | Visitor's ticket | `evidence/T-011/screens/06-ticket-desktop-1280x900.png` | **Recapture.** I looked at it: it still says "You leave here" twice, which T-012c fixed. |
| 6 | Hall on a phone | `evidence/T-011/screens/07-home-mobile-390x844.png` | Usable |
| 7 | One blueprint plate, full size | `evidence/T-011/plates/plate-005-preview.png` | Usable |
| 8 | Studio with the Exhibit review workflow | none | **New capture needed.** The Studio Workflows panel was never verified in a browser (T-013a acceptance note). If it doesn't work, swap in the custom review actions or cut the shot. |

Optional alternates: `evidence/T-012e/about-desktop-1280.png` (the /about colophon) and `evidence/T-012/og/*.png` (link-preview cards).

## Things I was unsure of

- **Hermes naming.** The packet asks me to name the earlier Hermes-orchestrated phase, and imp.md §6 does. about.md only says "a different setup built the first version". The founder's T-012a answer was "keep the Hermes wording for now". The post says "An earlier setup, orchestrated by Hermes", which is more specific than about.md but doesn't contradict it. The founder should confirm naming Hermes publicly.
- **Model name.** The build log and TASK_BOARD say the orchestrator is "Claude Code (Opus 5)". about.md and the T-012a founder answer say "Claude Opus 5.5". Following the packet, the post uses Opus 5.5. The two sources disagree, so this is worth one look.
- **Phase one's builder model.** The build log never names the phase-one builder's model; it says "builder sandbox" and "supervising session". The `gpt-5.5` attribution comes from imp.md §6 and the packet.
- **`npm install`.** It isn't in README. I added it as the obvious first step. The README might want the same line.
- **The /studio CORS note.** README lists only localhost origins. Whether the production origin gets added (imp.md §6) is still open, so the post only says "your origin must be allowed".
- **The ASCII diagrams.** DEV renders code blocks reliably. I used text diagrams, not mermaid, because I couldn't confirm DEV renders mermaid.
- **Reading time.** It lands near the top of the 9–14 minute range. If it needs trimming, the first things to cut are "An instruction that wasn't in the repository" and the "Smaller ones" list.
- **The injected-instruction story.** It is real and well documented in the build log, but the orchestrator's misattribution is a little embarrassing. It's kept because the brief asks for honesty. The founder may prefer to drop it.

## Claims left out (could not source, or out of scope)

- Anything about ISR, webhooks or Live Content: T-015 is still RUNNING, and nothing is logged as done.
- A production URL, production deploy, or production CORS: none exist in the log.
- Total hours spent, and the build start date relative to the contest window: not recorded in the log.
- The exact number of task packets or commits: not counted anywhere authoritative.
- The draft deploy URL: it is private (401 to logged-out visitors), so it's not useful in a public post.
- Prize money, judges, or scoring: excluded per the packet.
