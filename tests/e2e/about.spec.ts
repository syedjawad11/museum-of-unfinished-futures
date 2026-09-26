import { expect, test } from "@playwright/test";

/**
 * T-012e — /about renders the approved colophon (docs/content/about.md)
 * verbatim, and the footer's "Source on GitHub" link points at the real
 * repository instead of "#".
 */

const SITE_TITLE = "Museum of Unfinished Futures";
const PAGE_TITLE = "How this museum was built";
const REPO_URL = "https://github.com/syedjawad11/museum-of-unfinished-futures";

const SECTION_HEADINGS = [
  "What this is",
  "How it is made",
  "Who built it",
  "What went wrong",
  "What is not here",
] as const;

const DISTINCTIVE_SENTENCES = [
  "The Museum of Unfinished Futures is a small website of made-up inventions from futures that never happened.",
  "The site is built with Next.js 16 and Sanity.",
  "One founder, directing AI workers.",
  "The default Turbopack build failed in the worker's sandbox, which blocked a helper process from opening a port.",
  "Only six exhibits.",
] as const;

test("/about returns 200", async ({ request }) => {
  const response = await request.get("/about");
  expect(response.status()).toBe(200);
});

test("/about has the h1 and the five section h2s, in order", async ({
  page,
}) => {
  await page.goto("/about");

  await expect(
    page.getByRole("heading", { level: 1, name: PAGE_TITLE }),
  ).toBeVisible();

  const h2s = await page.locator("h2").allTextContents();
  expect(h2s).toEqual([...SECTION_HEADINGS]);
});

test("/about contains a distinctive sentence from each section", async ({
  page,
}) => {
  await page.goto("/about");
  const bodyText = await page.locator("body").innerText();

  for (const sentence of DISTINCTIVE_SENTENCES) {
    expect(bodyText).toContain(sentence);
  }
});

test("/about does not leak template markers or the sources comment", async ({
  page,
}) => {
  await page.goto("/about");
  const bodyText = await page.locator("body").innerText();
  const html = await page.content();

  expect(bodyText).not.toContain("{{");
  expect(bodyText).not.toContain("sources");
  // Next.js's own SSR/hydration markup contains harmless HTML comments like
  // <!--$--> around Suspense boundaries; what must never leak is the
  // colophon's own trailing build-log index, which starts with this text.
  expect(html).not.toContain("sources (all headings");
});

test("/about links to the exact repository URL, opening safely", async ({
  page,
}) => {
  await page.goto("/about");

  const repoLink = page
    .locator("article")
    .locator(`a[href="${REPO_URL}"]`);
  await expect(repoLink).toHaveCount(1);
  await expect(repoLink).toHaveAttribute("target", "_blank");
  const rel = await repoLink.getAttribute("rel");
  expect(rel).not.toBeNull();
  expect((rel as string).split(/\s+/)).toContain("noopener");
});

test("the footer's Source on GitHub link points at the exact repository URL", async ({
  page,
}) => {
  await page.goto("/");

  const footerLink = page.getByRole("link", { name: "Source on GitHub" });
  await expect(footerLink).toHaveAttribute("href", REPO_URL);
});

test("/about has the templated <title>", async ({ page }) => {
  await page.goto("/about");
  await expect(page).toHaveTitle(`${PAGE_TITLE} — ${SITE_TITLE}`);
});

test("/about has no horizontal overflow at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
});
