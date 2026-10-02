import { expect, test } from "@playwright/test";

const exhibits = [
  {
    title: "The Telephone for Calling Roads Not Taken",
    path: "/exhibits/roads-not-taken-telephone",
    choices: [
      ["Call the life you declined", "A familiar stranger answers"],
      ["Hang up before it rings", "A missed call arrives from you"],
    ],
  },
  {
    title: "The Umbrella That Remembers Every Storm",
    path: "/exhibits/memory-umbrella",
    choices: [
      ["Open it indoors", "The room rains back"],
      ["Leave it furled", "The forecast forgets your name"],
    ],
  },
  {
    title: "The Vending Machine That Sells Extra Mondays",
    path: "/exhibits/extra-mondays-vending-machine",
    choices: [
      ["Spend a plan", "A paper Monday drops"],
      ["Keep the weekend intact", "The machine keeps humming"],
    ],
  },
] as const;

for (const exhibit of exhibits) {
  test(`${exhibit.title} exposes both published outcomes`, async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Museum of Unfinished Futures" }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: new RegExp(exhibit.title) })
      .click();

    await expect(page).toHaveURL(new RegExp(`${exhibit.path}$`));
    await expect(
      page.getByRole("heading", { name: exhibit.title }),
    ).toBeVisible();
    await expect(page.locator("[data-plate-source] svg").first()).toBeVisible();

    for (const [choice, outcome] of exhibit.choices) {
      await page.getByRole("link", { name: choice, exact: true }).click();
      await expect(page.getByText("Linked outcome")).toBeVisible();
      await expect(page.getByRole("heading", { name: outcome })).toBeVisible();
      await page.goto(exhibit.path);
    }

    await page.getByRole("link", { name: "Back to the hall" }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: exhibit.title }),
    ).toBeVisible();
  });
}

const vendingMachine = exhibits[2];

test("home grid inlines a blueprint plate for every case", async ({ page }) => {
  await page.goto("/");

  const plateCount = await page.locator("[data-plate-source]").count();
  expect(plateCount).toBeGreaterThanOrEqual(3);
});

test("invalid choice shows a safe unavailable state", async ({ page }) => {
  await page.goto(`${vendingMachine.path}?choice=not-a-published-choice`);

  await expect(page.getByText("Choice unavailable")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No linked outcome exists." }),
  ).toBeVisible();
});

test("missing exhibit returns a noindex 404", async ({ page }) => {
  const response = await page.goto("/exhibits/does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("visitor journey remains usable at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const umbrella = exhibits[1];
  await expect(
    page.getByRole("heading", { name: umbrella.title }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: new RegExp(umbrella.title) })
    .click();
  await page.getByRole("link", { name: "Leave it furled" }).click();

  await expect(
    page.getByRole("heading", { name: "The forecast forgets your name" }),
  ).toBeVisible();
});

const wings = [
  {
    title: "The Civic Time Expansion Era",
    slug: "civic-time-expansion-era",
    summary:
      "A near future in which cities treated spare hours as public infrastructure, issuing extra weekdays through experimental municipal machines.",
    exhibitTitle: "The Vending Machine That Sells Extra Mondays",
  },
  {
    title: "The Counterfactual Communications Boom",
    slug: "counterfactual-communications-boom",
    summary:
      "An optimistic communications age when public telephone networks briefly connected callers to plausible lives they had chosen not to live.",
    exhibitTitle: "The Telephone for Calling Roads Not Taken",
  },
  {
    title: "The Domestic Weather Memory Era",
    slug: "domestic-weather-memory-era",
    summary:
      "A short-lived domestic design movement that taught everyday objects to store weather, mood, and the private history of sheltering together.",
    exhibitTitle: "The Umbrella That Remembers Every Storm",
  },
] as const;

test("home shows all three wing placards with their titles and summaries", async ({ page }) => {
  await page.goto("/");

  for (const wing of wings) {
    const heading = page.getByRole("heading", { name: wing.title, level: 2 });
    await expect(heading).toBeVisible();

    const placard = page.locator("section", { has: heading });
    await expect(placard.getByText(wing.summary, { exact: true })).toBeVisible();
  }
});

test("the floor plan links to a wing page and that wing lists its exhibit", async ({ page }) => {
  await page.goto("/");

  const floorPlan = page.getByRole("group", { name: "Museum floor plan" });
  await expect(floorPlan).toBeVisible();

  const civic = wings[0];
  await floorPlan
    .getByRole("link", { name: new RegExp(civic.title) })
    .click();

  await expect(page).toHaveURL(new RegExp(`/eras/${civic.slug}$`));
  await expect(
    page.getByRole("heading", { name: civic.title, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: civic.exhibitTitle }),
  ).toBeVisible();
});

test("a wing page's exhibit link reaches the exhibit page", async ({ page }) => {
  const domestic = wings[2];
  await page.goto(`/eras/${domestic.slug}`);

  await page
    .getByRole("link", { name: new RegExp(domestic.exhibitTitle) })
    .click();

  await expect(page).toHaveURL(/\/exhibits\/memory-umbrella$/);
  await expect(
    page.getByRole("heading", { name: domestic.exhibitTitle }),
  ).toBeVisible();
});

test("missing wing returns a noindex 404", async ({ page }) => {
  const response = await page.goto("/eras/does-not-exist");

  expect(response?.status()).toBe(404);
  // Next can stream a second identical robots tag on not-found pages.
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("a choice shows its consequence tags in display form", async ({
  page,
}) => {
  await page.goto(
    `${vendingMachine.path}?choice=spend-a-plan`,
  );

  await expect(
    page.getByRole("heading", { name: "A paper Monday drops" }),
  ).toBeVisible();
  await expect(page.getByText("Borrowed time", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Accruing interest", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Edited without asking", { exact: true }),
  ).toBeVisible();
});

test("the chain carries a visitor from one exhibit into the next wing", async ({
  page,
}) => {
  await page.goto(`${vendingMachine.path}?choice=spend-a-plan`);

  const telephone = exhibits[0];
  await page
    .getByRole("link", { name: `Continue to ${telephone.title}` })
    .click();

  // The Continue link now carries the accumulated trace forward as
  // `?trace=...` (see src/app/exhibits/[slug]/page.tsx), so the destination
  // URL may have a trailing query string; only the path is asserted here.
  await expect(page).toHaveURL(new RegExp(`${telephone.path}(\\?|$)`));
  await expect(
    page.getByRole("heading", { name: telephone.title }),
  ).toBeVisible();
});

test("a three-exhibit walk threads the whole museum as one route", async ({
  page,
}) => {
  const telephone = exhibits[0];
  const umbrella = exhibits[1];

  await page.goto(`${vendingMachine.path}?choice=spend-a-plan`);
  await expect(page).toHaveURL(
    new RegExp(`${vendingMachine.path}\\?choice=spend-a-plan$`),
  );
  await page
    .getByRole("link", { name: `Continue to ${telephone.title}` })
    .click();

  // See the trace-forwarding note above: Continue links now append `?trace=`.
  await expect(page).toHaveURL(new RegExp(`${telephone.path}(\\?|$)`));
  await page.getByRole("link", { name: "Call the life you declined" }).click();
  // Choice links also forward whatever trace arrived on this page, so
  // `&trace=...` may follow `?choice=call-declined-life`.
  await expect(page).toHaveURL(
    new RegExp(`${telephone.path}\\?choice=call-declined-life(&trace=|$)`),
  );
  await page
    .getByRole("link", { name: `Continue to ${umbrella.title}` })
    .click();

  await expect(page).toHaveURL(new RegExp(`${umbrella.path}(\\?|$)`));
  await expect(
    page.getByRole("heading", { name: umbrella.title }),
  ).toBeVisible();
});

test("a valid trace prints a ticket containing the expected composed text", async ({
  page,
}) => {
  await page.goto(
    "/your-future?trace=outcome-paper-monday,outcome-soft-refusal",
  );

  await expect(
    page.getByRole("heading", { name: "Your Unfinished Future" }),
  ).toBeVisible();
  // A tag phrase unique to outcome-paper-monday's consequenceTags, joined by
  // composeTicket's "Your trace carries ..." stem (src/domain/ticket.ts).
  await expect(
    page.getByText(/carrying a day that was never yours to keep/),
  ).toBeVisible();
  // The civic-time-expansion-era line from ticket-lines.json — both outcomes
  // share this era, so it must appear exactly once.
  await expect(
    page.getByText(
      "The Civic Time Expansion Era expects you back. It is still holding a day with your name on it and no year to put it in.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText(/Accession No\./)).toBeVisible();
});

test("a malformed trace renders the museum-voice failure state, not an error", async ({
  page,
}) => {
  const response = await page.goto("/your-future?trace=Not_A_Valid-id!!");

  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "This ticket could not be read." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to the hall" }),
  ).toBeVisible();
  // Never a stack trace: no digest/error chrome from Next's error overlay.
  await expect(page.getByText(/Application error/i)).toHaveCount(0);
});

test("walking two exhibits then printing the ticket mentions both wings", async ({
  page,
}) => {
  const telephone = exhibits[0];

  await page.goto(`${vendingMachine.path}?choice=spend-a-plan`);
  await page
    .getByRole("link", { name: `Continue to ${telephone.title}` })
    .click();
  await page.getByRole("link", { name: "Call the life you declined" }).click();
  await expect(
    page.getByRole("heading", { name: "A familiar stranger answers" }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: "Print your ticket for this trace" })
    .click();

  await expect(page).toHaveURL(
    /\/your-future\?trace=outcome-paper-monday,outcome-familiar-stranger$/,
  );
  await expect(
    page.getByRole("heading", { name: "Your Unfinished Future" }),
  ).toBeVisible();
  // The Civic Time Expansion Era line (from the vending machine outcome).
  await expect(
    page.getByText(/The Civic Time Expansion Era expects you back/),
  ).toBeVisible();
  // The Counterfactual Communications Boom line (from the telephone outcome).
  await expect(
    page.getByText(/The Counterfactual Communications Boom keeps your line open/),
  ).toBeVisible();
});
