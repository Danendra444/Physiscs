import { expect, test, type Page } from "@playwright/test";

const TOPICS = ["circular-motion", "gravitational-fields", "oscillations"];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

const check = (page: Page, id: string) => page.locator(`[data-selfcheck="${id}"]`);
const savedProgress = (page: Page, topic: string) =>
  page.evaluate((t) => JSON.parse(localStorage.getItem(`physlab:v1:notes:${t}`) ?? "null"), topic);

test.describe("syllabus map", () => {
  test("shows all 25 topics; only the 3 with content are links", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(page.getByTestId("topic-available")).toHaveCount(3);
    await expect(page.getByTestId("topic-soon")).toHaveCount(22);
    await expect(page.getByTestId("available-count")).toContainText("3 of 25");
    await expect(page.locator('a[href*="/topics/kinematics"]')).toHaveCount(0);
    for (const topic of TOPICS) {
      await expect(page.locator(`a[href$="/topics/${topic}/"]`).first()).toBeVisible();
      await expect(page.locator(`a[href$="/topics/${topic}/notes/"]`).first()).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("a topic that has no content yet is a 404, not a broken page", async ({ page }) => {
    const response = await page.goto("/topics/kinematics/");
    expect(response?.status()).toBe(404);
  });
});

test.describe("topic hub", () => {
  test("links to the notes and the simulations of the topic", async ({ page }) => {
    await page.goto("/topics/oscillations/");
    await expect(page.getByRole("heading", { level: 1, name: "Oscillations" })).toBeVisible();
    await expect(page.getByTestId("notes-progress")).toContainText("Self-checks 0/6 · Checklist 0/8");
    await page.getByTestId("notes-card").click();
    await expect(page).toHaveURL(/\/topics\/oscillations\/notes\/$/);
    await page.goto("/topics/oscillations/");
    await page.locator('a[href$="/sims/mass-spring/"]').first().click();
    await expect(page).toHaveURL(/\/sims\/mass-spring\/$/);
  });

  test("a simulation's theory panel links to the notes", async ({ page }) => {
    await page.goto("/sims/mass-spring/");
    await page.locator("details summary", { hasText: "Theory" }).click();
    await page.getByTestId("notes-link").click();
    await expect(page).toHaveURL(/\/topics\/oscillations\/notes\/$/);
  });
});

for (const topic of TOPICS) {
  test.describe(`notes: ${topic}`, () => {
    test("renders with maths, contents list, and no errors or overflow", async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(`/topics/${topic}/notes/`);

      await expect(page.locator("h1")).toContainText("notes");
      await expect(page.getByTestId("definition").first()).toBeVisible();
      await expect(page.getByTestId("key-equation").first()).toBeVisible();
      await expect(page.getByTestId("worked-example").first()).toBeVisible();
      await expect(page.getByTestId("common-mistake").first()).toBeVisible();
      await expect(page.getByTestId("exam-tip").first()).toBeVisible();
      await expect(page.getByTestId("try-sim").first()).toBeVisible();
      await expect(page.getByTestId("checklist")).toBeVisible();

      // Maths rendered, none left as raw $…$ text, no KaTeX errors.
      expect(await page.locator(".katex").count()).toBeGreaterThan(20);
      await expect(page.locator(".katex-error")).toHaveCount(0);
      const body = await page.locator("article.notes-body").innerText();
      expect(body).not.toMatch(/\$[^$\n]{1,40}\$/);
      expect(body).not.toContain("\\dfrac");
      expect(body).not.toContain("\\text");

      // Every heading has an id, and every contents link points at a real heading.
      const headings = await page.locator("article.notes-body h2").evaluateAll((els) => els.map((e) => e.id));
      expect(headings.length).toBeGreaterThanOrEqual(3);
      expect(headings.every(Boolean)).toBe(true);
      const hrefs = await page.locator("aside a[href^='#']").evaluateAll((els) => els.map((e) => e.getAttribute("href")!.slice(1)));
      expect(new Set(hrefs)).toEqual(new Set(headings));

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });

    test("the simulation card opens its simulation", async ({ page }) => {
      await page.goto(`/topics/${topic}/notes/`);
      await page.getByTestId("try-sim").first().click();
      await expect(page).toHaveURL(/\/sims\/[a-z-]+\/$/);
      await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    });
  });
}

test.describe("self-checks", () => {
  test("numeric: rejects non-numbers, marks, reveals help after two tries, and remembers", async ({ page }) => {
    await page.goto("/topics/oscillations/notes/");
    const q = check(page, "spring-period");
    await q.scrollIntoViewIfNeeded();
    const input = q.getByRole("textbox");
    const submit = q.getByRole("button", { name: "Check answer" });

    // Not a number: not marked, not counted.
    await input.fill("about one");
    await submit.click();
    await expect(q.getByRole("status")).toContainText("Enter a number");
    expect(await savedProgress(page, "oscillations")).toBeNull();

    // A wrong answer, then a second wrong answer reveals the answer and the explanation.
    await input.fill("2.5");
    await submit.click();
    await expect(q.getByRole("status")).toContainText("Not quite");
    await expect(page.getByTestId("selfcheck-explanation")).toHaveCount(0);
    await input.fill("0.5");
    await submit.click();
    await expect(q.getByTestId("selfcheck-explanation")).toBeVisible();
    await expect(q).toContainText("The answer is");

    // The right answer, typed with a decimal comma.
    await input.fill("1,26");
    await submit.click();
    await expect(q).toContainText("Correct.");
    await expect(q.getByRole("button", { name: "Check answer" })).toHaveCount(0);

    // Saved, and restored after a reload.
    await page.waitForFunction(() => localStorage.getItem("physlab:v1:notes:oscillations")?.includes('"spring-period"'));
    expect((await savedProgress(page, "oscillations")).checks["spring-period"]).toEqual({ correct: true, attempts: 3 });
    await page.reload();
    await expect(check(page, "spring-period")).toContainText("Correct.");

    // The topic hub reflects it.
    await page.goto("/topics/oscillations/");
    await expect(page.getByTestId("notes-progress")).toContainText("Self-checks 1/6");
  });

  test("multiple choice: asks for an answer first, then marks it", async ({ page }) => {
    await page.goto("/topics/circular-motion/notes/");
    const q = check(page, "resultant-direction");
    await q.scrollIntoViewIfNeeded();
    await q.getByRole("button", { name: "Check answer" }).click();
    await expect(q.getByRole("status")).toContainText("Choose an answer first");
    expect(await savedProgress(page, "circular-motion")).toBeNull();

    await q.getByRole("radio").nth(0).check();
    await q.getByRole("button", { name: "Check answer" }).click();
    await expect(q.getByRole("status")).toContainText("Not quite");

    await q.getByRole("radio").nth(2).check();
    await q.getByRole("button", { name: "Check answer" }).click();
    await expect(q).toContainText("Correct.");
    await expect(q.getByTestId("selfcheck-explanation")).toBeVisible();
  });

  test("a scientific-notation answer with a minus sign is accepted", async ({ page }) => {
    await page.goto("/topics/gravitational-fields/notes/");
    const q = check(page, "potential-surface");
    await q.scrollIntoViewIfNeeded();
    await q.getByRole("textbox").fill("6.25×10^7"); // wrong sign
    await q.getByRole("button", { name: "Check answer" }).click();
    await expect(q.getByRole("status")).toContainText("Not quite");
    await q.getByRole("textbox").fill("−6.25×10^7");
    await q.getByRole("button", { name: "Check answer" }).click();
    await expect(q).toContainText("Correct.");
  });
});

test.describe("checklist", () => {
  test("ticks are counted, saved and shown on the hub", async ({ page }) => {
    await page.goto("/topics/gravitational-fields/notes/");
    const list = page.getByTestId("checklist");
    await list.scrollIntoViewIfNeeded();
    await expect(list).toContainText("0 of 9 ticked");
    await list.getByRole("checkbox").nth(0).check();
    await list.getByRole("checkbox").nth(3).check();
    await expect(list).toContainText("2 of 9 ticked");
    await page.waitForFunction(() => localStorage.getItem("physlab:v1:notes:gravitational-fields")?.includes("true"));
    await page.reload();
    await expect(page.getByTestId("checklist")).toContainText("2 of 9 ticked");
    await expect(page.getByTestId("checklist").getByRole("checkbox").nth(0)).toBeChecked();
    await page.goto("/topics/gravitational-fields/");
    await expect(page.getByTestId("notes-progress")).toContainText("Checklist 2/9");
  });
});

test.describe("worked examples", () => {
  test("reveal one step at a time", async ({ page }) => {
    await page.goto("/topics/oscillations/notes/");
    const example = page.getByTestId("worked-example").first();
    await example.scrollIntoViewIfNeeded();
    await expect(example.getByTestId("step-shown")).toHaveCount(0);
    await example.getByRole("button", { name: "Show first step" }).click();
    await expect(example.getByTestId("step-shown")).toHaveCount(1);
    await example.getByRole("button", { name: "Show next step" }).click();
    await expect(example.getByTestId("step-shown")).toHaveCount(2);
    await example.getByRole("button", { name: "Show all steps" }).click();
    await expect(example.getByTestId("step-shown")).toHaveCount(5);
    await expect(example.getByRole("button", { name: "Show next step" })).toHaveCount(0);
    await example.getByRole("button", { name: "Hide steps" }).click();
    await expect(example.getByTestId("step-shown")).toHaveCount(0);
  });
});

test.describe("printing", () => {
  test("prints the notes with every worked step and without buttons or navigation", async ({ page }) => {
    await page.goto("/topics/circular-motion/notes/");
    await page.emulateMedia({ media: "print" });
    // Steps that are hidden on screen are visible in print.
    const example = page.getByTestId("worked-example").first();
    for (const step of await example.locator("ol > li").all()) await expect(step).toBeVisible();
    await expect(page.getByRole("button", { name: "Print notes" })).toBeHidden();
    await expect(page.locator("nav[aria-label='On this page']")).toBeHidden();
    await expect(page.locator("header").first()).toBeHidden();
    await expect(check(page, "unit-omega").getByRole("button", { name: "Check answer" })).toBeHidden();
    // Multiple-choice options are printed so the question makes sense on paper.
    await expect(check(page, "unit-omega").locator("ol.print-only")).toBeVisible();
  });
});

test.describe("when the browser blocks storage", () => {
  test("notes still work and a notice explains that nothing is saved", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("blocked");
        },
      });
    });
    const errors = trackErrors(page);
    await page.goto("/topics/oscillations/notes/");
    await expect(page.getByText("won't be saved")).toBeVisible();
    const q = check(page, "omega-from-f");
    await q.getByRole("textbox").fill("15.7");
    await q.getByRole("button", { name: "Check answer" }).click();
    await expect(q).toContainText("Correct.");
    expect(errors).toEqual([]);
  });
});

test.describe("every link on the site works", () => {
  test("crawls from the home page and finds no broken internal link", async ({ page, request, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const seen = new Set<string>();
    const queue = ["/"];
    const broken: string[] = [];

    while (queue.length > 0) {
      const path = queue.shift()!;
      if (seen.has(path)) continue;
      seen.add(path);
      const response = await request.get(origin + path);
      if (response.status() !== 200) {
        broken.push(`${response.status()} ${path}`);
        continue;
      }
      await page.goto(origin + path);
      const hrefs = await page.locator("a[href]").evaluateAll((els) =>
        els.map((a) => (a as HTMLAnchorElement).href),
      );
      for (const href of hrefs) {
        const url = new URL(href);
        if (url.origin === origin && !seen.has(url.pathname)) queue.push(url.pathname);
      }
    }

    expect(broken).toEqual([]);
    // Home, 3 topic hubs, 3 notes pages, 3 simulations, About.
    expect(seen.size).toBeGreaterThanOrEqual(11);
  });
});
