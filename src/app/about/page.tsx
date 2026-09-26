import type { Metadata } from "next";
import { Doorway } from "@/components/Doorway";
import { trimDescription } from "@/content/og-card";

/**
 * T-012e — the founder-approved colophon (docs/content/about.md) rendered
 * as a static route. Every heading, paragraph and bullet below is
 * transcribed verbatim from that file, in the same order; the trailing
 * `<!-- sources ... -->` comment in the markdown is a build-log index for
 * humans and is intentionally not rendered.
 */

const REPO_URL = "https://github.com/syedjawad11/museum-of-unfinished-futures";
const SANITY_PROJECT_ID = "wa27n68e";

const WHAT_THIS_IS =
  "The Museum of Unfinished Futures is a small website of made-up inventions from futures that never happened. Six exhibits hang in three wings, two per wing. Each exhibit is a blueprint drawing with a plaque and a choice. Each choice leads to an ending, and each ending opens a door to a different exhibit. The endings you reach become a ticket you can take away.";

export const metadata: Metadata = {
  title: "How this museum was built",
  description: trimDescription(WHAT_THIS_IS),
};

const CODE_CLASS =
  "rounded bg-hall/60 px-1.5 py-0.5 font-mono text-[0.9em] text-glass";

const WENT_WRONG = [
  "The default Turbopack build failed in the worker's sandbox, which blocked a helper process from opening a port. The build now uses Webpack.",
  "A reviewer found that the custom publish button checked curator approval but skipped Sanity's schema validation. Publishing now waits for validation to pass.",
  "On the same day, two workers from two different model families wrote a test that could not fail. Proving that each assertion can fail is now a written step.",
  'The ticket page once read "Your trace carries carrying…" while every automated check passed. Only reading the page caught it.',
  "Publishing the three newest exhibits stopped halfway: each review record held a strong reference to its exhibit, and a brand-new exhibit had nothing published to point to. The reference is now weak, and a second run finished the job.",
];

const NOT_HERE = [
  "Only six exhibits.",
  "The review flow covers exhibits only. Endings were published by a separate, guarded script.",
  "Every ticket shares one link-preview picture; only the title and description change, because of a limit in this version of Next.js.",
  "The floor plan on a wing page does not yet light up the room you are in.",
  "The Sanity command-line and Studio tooling carries 15 known dependency advisories (12 moderate, 3 high). The only automatic fix is an incompatible Sanity downgrade, so it was not applied.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
      <Doorway href="/" label="Back to the hall" />

      <article className="mx-auto flex w-full max-w-[65ch] flex-col gap-10">
        <header className="border-l-4 border-accent/60 pl-6 sm:pl-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-brass">
            Back room · colophon
          </p>
          <h1 className="mt-2 font-display text-4xl text-spotlight sm:text-5xl">
            How this museum was built
          </h1>
          <p className="mt-4 text-lg leading-8 text-ink-muted">
            Every building keeps a back room where the plans are stored. This
            is ours. From here on, the labels only say what happened.
          </p>
        </header>

        <section aria-labelledby="about-what-this-is">
          <h2
            className="font-display text-2xl text-accent sm:text-3xl"
            id="about-what-this-is"
          >
            What this is
          </h2>
          <p className="mt-3 leading-7 text-ink">{WHAT_THIS_IS}</p>
        </section>

        <section aria-labelledby="about-how-it-is-made">
          <h2
            className="font-display text-2xl text-accent sm:text-3xl"
            id="about-how-it-is-made"
          >
            How it is made
          </h2>
          <div className="mt-3 flex flex-col gap-4 leading-7 text-ink">
            <p>
              The site is built with Next.js 16 and Sanity. Exhibits, wings
              and endings are separate documents that point to one another.
              An exhibit holds two to four choices; each leads to its own
              ending, which can carry consequence tags and a link to the next
              exhibit.
            </p>
            <p>
              {
                "The blueprint plates are original SVG drawings, stored as Sanity image assets, checked for unsafe markup and drawn into the page in each wing's accent colour."
              }
            </p>
            <p>
              {
                "New exhibits go through a curator review flow built into Sanity Studio. A draft is submitted, then approved against that exact revision. It is published only through a guarded action that also waits for Sanity's own validation to pass."
              }
            </p>
            <p>
              Your ticket lives entirely in the page address (
              <code className={CODE_CLASS}>/your-future?trace=…</code>).
              There are no accounts and nothing is stored. The same address
              always composes the same ticket, so it can be shared.
            </p>
          </div>
        </section>

        <section aria-labelledby="about-who-built-it">
          <h2
            className="font-display text-2xl text-accent sm:text-3xl"
            id="about-who-built-it"
          >
            Who built it
          </h2>
          <p className="mt-3 leading-7 text-ink">
            {
              "One founder, directing AI workers. From the evening of September 21, 2026, Claude Code (Claude Opus 5.5) orchestrated: it wrote a task packet for each job, handed it to a worker and reran the checks itself. Code and scripts came from OpenAI Codex (gpt-5.5). Interface work, the blueprint plates and browser tests came from Claude Sonnet 5 agents. The newer fiction came from a Claude Opus writer. Most work was reviewed by a different model family than the one that built it: Codex gpt-5.6-sol or a Claude reviewer. Before that, a different setup built the first version, including the Sanity connection and the review flow. Deploys waited for the founder's approval."
            }
          </p>
        </section>

        <section aria-labelledby="about-what-went-wrong">
          <h2
            className="font-display text-2xl text-accent sm:text-3xl"
            id="about-what-went-wrong"
          >
            What went wrong
          </h2>
          <ul className="mt-3 flex list-disc flex-col gap-3 pl-5 leading-7 text-ink">
            {WENT_WRONG.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="about-what-is-not-here">
          <h2
            className="font-display text-2xl text-accent sm:text-3xl"
            id="about-what-is-not-here"
          >
            What is not here
          </h2>
          <ul className="mt-3 flex list-disc flex-col gap-3 pl-5 leading-7 text-ink">
            {NOT_HERE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <p className="break-words border-t border-brass-dim/50 pt-6 font-mono text-sm text-ink-muted">
          Source code:{" "}
          <a
            className="text-brass underline decoration-brass-dim/60 underline-offset-4 motion-safe:transition hover:text-accent"
            href={REPO_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            {REPO_URL}
          </a>{" "}
          · Sanity project ID <code className={CODE_CLASS}>{SANITY_PROJECT_ID}</code>
        </p>
      </article>
    </div>
  );
}
