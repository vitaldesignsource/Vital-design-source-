import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function motionTime(target: Locator) {
  return target.evaluate((element) => {
    const time = element.getAnimations()[0]?.currentTime;
    return typeof time === "number" ? time : 0;
  });
}

async function expectProgress(target: Locator) {
  const time = await motionTime(target);
  await expect.poll(() => motionTime(target)).toBeGreaterThan(time + 60);
}

async function expectFrozen(target: Locator) {
  await expect
    .poll(() =>
      target.evaluate((element) =>
        element
          .getAnimations()
          .every(
            (animation) =>
              animation.playState === "paused" && !animation.pending,
          ),
      ),
    )
    .toBe(true);
  const time = await motionTime(target);
  await new Promise((resolve) => setTimeout(resolve, 250));
  expect(await motionTime(target)).toBeCloseTo(time, 0);
  return time;
}

async function setHidden(page: Page, hidden: boolean) {
  await page.evaluate((value) => {
    if (value) {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
    } else {
      Reflect.deleteProperty(document, "hidden");
      Reflect.deleteProperty(document, "visibilityState");
    }
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

async function expectNoOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
}

test.describe("site background motion", () => {
  test.skip(
    ({ isMobile }) => isMobile,
    "Explicit narrow-screen contexts cover this feature once.",
  );

  test("keeps the background decorative and synchronizes accessible pause controls", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#work");
    const atmosphere = page.locator(".site-atmosphere");
    const glow = atmosphere.locator(".site-atmosphere-glow-one");
    await expect(atmosphere).toHaveAttribute("aria-hidden", "true");
    await expect(atmosphere).toHaveAttribute("data-motion", "running");
    await expect(atmosphere).toHaveCSS("pointer-events", "none");
    await expect(
      atmosphere.locator(
        "a, button, [tabindex]:not([tabindex='-1']), script, image, foreignObject",
      ),
    ).toHaveCount(0);
    for (const svg of await atmosphere.locator("svg").all())
      await expect(svg).toHaveAttribute("focusable", "false");
    const workHeading = page.locator("#work .section-heading");
    await workHeading.scrollIntoViewIfNeeded();
    expect(
      await workHeading.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return !document
          .elementFromPoint(bounds.left + 12, bounds.top + 12)
          ?.closest(".site-atmosphere");
      }),
    ).toBe(true);
    await expectProgress(glow);

    const pause = () =>
      page.getByRole("button", {
        name: "Pause background motion",
        exact: true,
      });
    const resume = () =>
      page.getByRole("button", {
        name: "Resume background motion",
        exact: true,
      });
    await expect(pause()).toHaveCount(2);
    await expect(pause().first()).toHaveAttribute("aria-pressed", "true");
    await expect(pause().last()).toHaveAttribute("aria-pressed", "true");
    const runningTime = await motionTime(glow);
    await pause().last().click();
    await expect(atmosphere).toHaveAttribute("data-motion", "paused");
    await expect(resume()).toHaveCount(2);
    await expect(resume().first()).toHaveAttribute("aria-pressed", "false");
    await expect(resume().last()).toHaveAttribute("aria-pressed", "false");
    expect(await expectFrozen(glow)).toBeGreaterThanOrEqual(runningTime);

    // The first control remains keyboard-operable without bringing the crest
    // back onscreen during this background-only motion check.
    await resume()
      .first()
      .evaluate((element: HTMLButtonElement) =>
        element.focus({ preventScroll: true }),
      );
    await expect(resume().first()).toBeFocused();
    await resume().first().press("Space");
    await expect(atmosphere).toHaveAttribute("data-motion", "running");
    await expectProgress(glow);

    await setHidden(page, true);
    await expect(atmosphere).toHaveAttribute("data-motion", "paused");
    await expectFrozen(glow);
    await setHidden(page, false);
    await expect(atmosphere).toHaveAttribute("data-motion", "running");
    await expectProgress(glow);

    await pause().last().click();
    await expectFrozen(glow);
    await setHidden(page, true);
    await setHidden(page, false);
    await expect(atmosphere).toHaveAttribute("data-motion", "paused");
    await expect(resume()).toHaveCount(2);
    await expectFrozen(glow);

    const accessibility = await new AxeBuilder({ page })
      .include(".footer")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("offers a static narrow-screen fallback for motion, data and JavaScript preferences", async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(45_000);
    for (const preference of [
      { width: 320, reducedMotion: "reduce", saveData: false },
      { width: 390, reducedMotion: "no-preference", saveData: true },
    ] as const) {
      const context = await browser.newContext({
        baseURL,
        viewport: { width: preference.width, height: 844 },
        reducedMotion: preference.reducedMotion,
      });
      try {
        if (preference.saveData)
          await context.addInitScript(() => {
            Object.defineProperty(navigator, "connection", {
              configurable: true,
              value: Object.assign(new EventTarget(), { saveData: true }),
            });
          });
        const page = await context.newPage();
        await page.goto("/#work");
        await expect(page.locator(".site-atmosphere")).toHaveAttribute(
          "data-motion",
          "paused",
        );
        await expectFrozen(page.locator(".site-atmosphere-glow-one"));
        await expect(
          page.getByRole("button", { name: /background motion$/ }),
        ).toHaveCount(0);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoOverflow(page);
      } finally {
        await context.close();
      }
    }

    const context = await browser.newContext({
      baseURL,
      viewport: { width: 320, height: 844 },
      reducedMotion: "no-preference",
      javaScriptEnabled: false,
    });
    try {
      const page = await context.newPage();
      await page.goto("/#work");
      await expect(page.locator(".site-atmosphere")).toHaveAttribute(
        "data-motion",
        "paused",
      );
      await expectFrozen(page.locator(".site-atmosphere-glow-one"));
      await expect(
        page.getByRole("button", { name: /background motion$/ }),
      ).toHaveCount(0);
      await expect(page.locator(".project")).toHaveCount(8);
      await expectNoOverflow(page);
    } finally {
      await context.close();
    }

    const narrow = await browser.newContext({
      baseURL,
      viewport: { width: 320, height: 844 },
      reducedMotion: "no-preference",
    });
    try {
      const page = await narrow.newPage();
      await page.goto("/#work");
      const pause = page.getByRole("button", {
        name: "Pause background motion",
        exact: true,
      });
      await expect(pause).toHaveCount(2);
      for (const control of await pause.all()) {
        const bounds = await control.boundingBox();
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
        expect(bounds?.width).toBeGreaterThanOrEqual(44);
      }
      await pause.last().click();
      await expect(page.locator(".site-atmosphere")).toHaveAttribute(
        "data-motion",
        "paused",
      );
      await expectFrozen(page.locator(".site-atmosphere-glow-one"));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(
        page.getByRole("button", { name: /background motion$/ }),
      ).toHaveCount(0);
      await expectFrozen(page.locator(".site-atmosphere-glow-one"));
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(
        page.getByRole("button", {
          name: "Resume background motion",
          exact: true,
        }),
      ).toHaveCount(2);
      await expectFrozen(page.locator(".site-atmosphere-glow-one"));
      await expectNoOverflow(page);
    } finally {
      await narrow.close();
    }
  });
});
