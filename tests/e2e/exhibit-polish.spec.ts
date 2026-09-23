import { expect, test } from "@playwright/test";

/**
 * T-012b — three visual-polish regressions on the exhibit page:
 *  1. The SELECTED badge crowding the choice label.
 *  2. The "Continue to → <title>" link wrapping awkwardly on long titles.
 *  3. The vitrine frame being taller than the plate it holds.
 *
 * All three are measured with boundingBox() rather than eyeballed, per the
 * task packet.
 */

const EXHIBIT_PATH = "/exhibits/unfinished-conversations-switchboard";

const CHOICES = [
  "Answer the line that is still lit",
  "Pull every cord at once",
  "Plug a cord into the blank jack",
] as const;

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
] as const;

type Box = { x: number; y: number; width: number; height: number };

function intersects(a: Box, b: Box): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

for (const viewport of VIEWPORTS) {
  test.describe(`SELECTED badge vs. label — ${viewport.width}x${viewport.height}`, () => {
    for (const choice of CHOICES) {
      test(`does not crowd "${choice}"`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(EXHIBIT_PATH);
        await page.getByRole("link", { name: choice, exact: true }).click();

        const selectedLink = page.locator('a[aria-current="true"]');
        const badge = selectedLink.locator('[data-testid="choice-selected-badge"]');
        const label = selectedLink.locator('[data-testid="choice-label"]');

        await expect(badge).toBeVisible();
        await expect(label).toBeVisible();

        const badgeBox = await badge.boundingBox();
        const labelBox = await label.boundingBox();

        expect(badgeBox).not.toBeNull();
        expect(labelBox).not.toBeNull();
        expect(intersects(badgeBox as Box, labelBox as Box)).toBe(false);
      });
    }
  });
}

test("Continue-to link keeps the arrow on the prefix's own line", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(EXHIBIT_PATH);
  await page
    .getByRole("link", { name: "Answer the line that is still lit", exact: true })
    .click();

  const link = page.getByRole("link", {
    name: "Continue to The Umbrella That Remembers Every Storm",
  });
  await expect(link).toBeVisible();

  const prefix = page.locator('[data-testid="continue-to-prefix"]');
  const arrow = page.locator('[data-testid="continue-to-arrow"]');

  await expect(prefix).toBeVisible();
  await expect(arrow).toBeVisible();

  const prefixBox = await prefix.boundingBox();
  const arrowBox = await arrow.boundingBox();

  expect(prefixBox).not.toBeNull();
  expect(arrowBox).not.toBeNull();

  // The arrow's top must fall within the prefix's own (single-line) box —
  // i.e. the arrow never floats between two wrapped lines of "Continue to".
  expect((arrowBox as Box).y).toBeGreaterThanOrEqual((prefixBox as Box).y - 1);
  expect((arrowBox as Box).y).toBeLessThanOrEqual(
    (prefixBox as Box).y + (prefixBox as Box).height + 1,
  );
});

test("vitrine frame hugs the plate's 4:3 aspect (no empty band)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(EXHIBIT_PATH);

  const frame = page.locator('[data-testid="vitrine-frame"]');
  const glassCase = page.locator('[data-testid="vitrine-case"]');
  const plate = page.locator('[data-plate-source] svg');

  const frameBox = await frame.boundingBox();
  const caseBox = await glassCase.boundingBox();
  const plateBox = await plate.boundingBox();

  expect(frameBox).not.toBeNull();
  expect(caseBox).not.toBeNull();
  expect(plateBox).not.toBeNull();

  const f = frameBox as Box;
  const c = caseBox as Box;
  const p = plateBox as Box;

  // Padding stack above the plate: frame->case padding, plus case->plate
  // padding. Symmetric (Tailwind p-* is uniform), so the same amount is
  // expected below the plate too.
  const topPadding = c.y - f.y + (p.y - c.y);

  expect(f.height).toBeLessThanOrEqual(p.height + 2 * topPadding + 4);
});
