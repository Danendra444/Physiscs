import { expect, test, type Page } from "@playwright/test";

const SIMS = ["centripetal-force", "satellite-orbits", "mass-spring"];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

test("home page lists every simulation", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  for (const slug of SIMS) await expect(page.locator(`a[href$="/sims/${slug}/"]`).first()).toBeVisible();
  expect(errors).toEqual([]);
});

for (const slug of SIMS) {
  test(`${slug}: predict, play, record a reading`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`/sims/${slug}/`);

    const play = page.getByRole("button", { name: "Play", exact: true });
    await expect(play).toBeDisabled();

    // Make a prediction to unlock Play.
    await page.locator(".screen-only input[type=radio]").first().check();
    await page.getByRole("button", { name: "Lock in prediction" }).click();
    await expect(play).toBeEnabled();
    await play.click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

    // Record once the reading is available (periods need one full cycle).
    const record = page.getByTestId("record");
    await expect(record).toBeEnabled({ timeout: 20_000 });
    await record.click();
    await expect(page.getByTestId("data-table").first().locator("tbody tr")).toHaveCount(1);

    // Progress survives a reload.
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.getByTestId("data-table").first().locator("tbody tr")).toHaveCount(1);

    // No horizontal scrolling on any screen size.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    expect(errors).toEqual([]);
  });
}

test("the hand-in summary is only visible when printing", async ({ page }) => {
  await page.goto("/sims/mass-spring/");
  const handIn = page.locator("article.print-only");
  await expect(handIn).toBeHidden();
  await page.emulateMedia({ media: "print" });
  await expect(handIn).toBeVisible();
  await expect(page.locator(".screen-only").first()).toBeHidden();
});
