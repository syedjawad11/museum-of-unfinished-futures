import { expect, test } from "@playwright/test";

/**
 * T-012d — per-exhibit/era titles, link-preview images, icon, sitemap and
 * robots. Titles, slugs and wing names below are read straight off the
 * public Sanity CDN (production_1), the same source the pages themselves
 * render from.
 */

const SITE_TITLE = "Museum of Unfinished Futures";

const exhibits = [
  {
    slug: "future-self-toaster",
    title: "The Toaster That Prints Notes From Your Future Self",
  },
  {
    // The longest title in the dataset — the one most likely to clip or
    // overflow an og:image card.
    slug: "unfinished-conversations-switchboard",
    title: "The Switchboard for Conversations That Ended Too Soon",
  },
  {
    slug: "weather-of-visits-kettle",
    title: "The Kettle That Brews the Weather of Past Visits",
  },
  {
    slug: "roads-not-taken-telephone",
    title: "The Telephone for Calling Roads Not Taken",
  },
  {
    slug: "extra-mondays-vending-machine",
    title: "The Vending Machine That Sells Extra Mondays",
  },
  {
    slug: "memory-umbrella",
    title: "The Umbrella That Remembers Every Storm",
  },
] as const;

const wings = [
  { slug: "civic-time-expansion-era", title: "The Civic Time Expansion Era" },
  {
    slug: "counterfactual-communications-boom",
    title: "The Counterfactual Communications Boom",
  },
  {
    slug: "domestic-weather-memory-era",
    title: "The Domestic Weather Memory Era",
  },
] as const;

/** Resolves an (often metadataBase-absolute) og:image URL to a same-origin
 * path/query so the check hits the build under test, not the production
 * domain baked into metadataBase. */
function toLocalPath(url: string): string {
  const parsed = new URL(url, "http://127.0.0.1:3100");
  return `${parsed.pathname}${parsed.search}`;
}

for (const exhibit of exhibits) {
  test(`exhibit "${exhibit.title}" has exhibit-specific metadata and a working og:image`, async ({
    page,
    request,
  }) => {
    await page.goto(`/exhibits/${exhibit.slug}`);

    await expect(page).toHaveTitle(`${exhibit.title} — ${SITE_TITLE}`);

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description).not.toBeNull();
    expect((description as string).length).toBeLessThanOrEqual(160);

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .first()
      .getAttribute("content");
    expect(ogImage).not.toBeNull();

    const response = await request.get(toLocalPath(ogImage as string));
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  });
}

test("a wing page has its own title", async ({ page }) => {
  const wing = wings[0];
  await page.goto(`/eras/${wing.slug}`);
  await expect(page).toHaveTitle(`${wing.title} — ${SITE_TITLE}`);
});

test("the home page has a title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(SITE_TITLE);
});

test("/sitemap.xml lists all 6 exhibit URLs and 3 wing URLs", async ({
  request,
}) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();

  for (const exhibit of exhibits) {
    expect(body).toContain(`/exhibits/${exhibit.slug}</loc>`);
  }

  for (const wing of wings) {
    expect(body).toContain(`/eras/${wing.slug}</loc>`);
  }
});

test("/robots.txt disallows /studio and points at the sitemap", async ({
  request,
}) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();

  expect(body).toMatch(/Disallow:\s*\/studio/);
  expect(body).toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/);
});

test("the icon link resolves", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="icon"]').first().getAttribute("href");
  expect(href).not.toBeNull();

  const response = await request.get(toLocalPath(href as string));
  expect(response.status()).toBe(200);
});
