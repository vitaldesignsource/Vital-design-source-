import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const catalog = [
  {
    name: "Aetherica Podcast",
    url: "https://aethericapodcast.com",
    headline: "An atmosphere for deeper listening.",
  },
  {
    name: "The Architecture of Hidden Forces",
    url: "https://thearchitectureofhiddenforces.com",
    headline: "Architecture as an invitation.",
    disclosure: "Project artwork · private release",
    artwork: true,
  },
  {
    name: "Astera Roofing",
    url: "https://asteraroofing.com",
    headline: "A sharper visual structure.",
  },
  {
    name: "Sky Mathis",
    url: "https://skymathis.com",
    headline: "A personal world, thoughtfully framed.",
  },
  {
    name: "3 Magi Press",
    url: "https://threemagipress.com",
    headline: "A striking home for the written word.",
  },
  {
    name: "PigeonShield",
    url: "https://pigeonshield.net",
    headline: "A clear, unmistakable service presence.",
    disclosure: "Website source preview",
  },
];

test("opens every project with its own study and an honest same-image detail view", async ({
  page,
}) => {
  // Six independent modal journeys, including image decode and scroll, share this test.
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#work");
  for (const project of catalog) {
    await page
      .getByRole("button", { name: `Explore ${project.name}`, exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: project.name,
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", {
        level: 2,
        name: project.name,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: project.headline, exact: true }),
    ).toBeVisible();
    const visit = dialog.getByRole("link", {
      name: `Visit ${project.name} website (opens in a new tab)`,
      exact: true,
    });
    await expect(visit).toHaveAttribute("href", project.url);
    await expect(visit).toHaveAttribute("target", "_blank");
    await expect(visit).toHaveAttribute("rel", /\bnoopener\b/);
    await expect(visit).toHaveAttribute("rel", /\bnoreferrer\b/);
    await expect(dialog.locator(".showcase-source-label")).toHaveText(
      project.disclosure || "Website preview",
    );
    if (project.artwork) {
      await expect(
        dialog.getByText("Project artwork", { exact: true }),
      ).toBeVisible();
      await expect(dialog).toContainText("The project is a private release.");
    }

    const preview = dialog.getByRole("group", { name: "Project preview" });
    const full = preview.getByRole("button", {
      name: project.artwork ? "Artwork" : "Desktop",
      exact: true,
    });
    const detail = preview.getByRole("button", { name: "Detail", exact: true });
    await expect(full).toHaveAttribute("aria-pressed", "true");
    await expect(detail).toHaveAttribute("aria-pressed", "false");
    await expect(
      dialog.getByText("Full composition", { exact: true }),
    ).toBeVisible();
    const image = dialog.getByRole("img");
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0);
    const source = await image.evaluate((element: HTMLImageElement) => ({
      src: element.getAttribute("src"),
      srcset: element.getAttribute("srcset"),
      selected: element.currentSrc,
    }));
    await detail.click();
    await expect(detail).toHaveAttribute("aria-pressed", "true");
    await expect(full).toHaveAttribute("aria-pressed", "false");
    await expect(
      dialog.getByText("Detail crop · same source image", { exact: true }),
    ).toBeVisible();
    await expect(image).toHaveAttribute("alt", /detail crop of the same image/);
    expect(
      await image.evaluate((element: HTMLImageElement) => ({
        src: element.getAttribute("src"),
        srcset: element.getAttribute("srcset"),
        selected: element.currentSrc,
      })),
    ).toEqual(source);
    await full.click();
    await expect(full).toHaveAttribute("aria-pressed", "true");
    await expect(detail).toHaveAttribute("aria-pressed", "false");
    await expect(image).not.toHaveAttribute("alt", /detail crop/);
    await dialog
      .getByRole("button", { name: "Close project showcase" })
      .click();
    await expect(dialog).not.toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("navigates in both directions, wraps the catalog, and resets the detail view", async ({
  page,
}) => {
  await page.goto("/#work");
  await page
    .getByRole("button", { name: "Explore PigeonShield", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Detail", exact: true }).click();
  await dialog
    .getByRole("button", {
      name: "Next project Aetherica Podcast",
      exact: true,
    })
    .click();
  const heading = dialog.getByRole("heading", { level: 2 });
  await expect(heading).toHaveText("Aetherica Podcast");
  await expect(heading).toBeFocused();
  await expect(dialog.getByRole("status")).toHaveText(
    "Aetherica Podcast. Project 1 of 6.",
  );
  await expect(
    dialog.getByRole("button", { name: "Desktop", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    dialog.getByRole("button", { name: "Detail", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect
    .poll(() => dialog.evaluate((element) => element.scrollTop))
    .toBe(0);
  await dialog
    .getByRole("button", { name: "Previous project PigeonShield", exact: true })
    .click();
  await expect(heading).toHaveText("PigeonShield");
  await expect(dialog.getByRole("status")).toHaveText(
    "PigeonShield. Project 6 of 6.",
  );
  await dialog
    .getByRole("button", { name: "Previous project 3 Magi Press", exact: true })
    .click();
  await expect(heading).toHaveText("3 Magi Press");
  await expect(dialog.getByRole("status")).toHaveText(
    "3 Magi Press. Project 5 of 6.",
  );
});

test("Escape and Close restore the opening control and the previous body overflow", async ({
  page,
}) => {
  await page.goto("/#work");
  await page.evaluate(() => {
    document.body.style.overflow = "auto";
  });
  for (const closeWith of ["Escape", "Close"] as const) {
    const trigger = page.getByRole("button", {
      name: "Explore Sky Mathis",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Sky Mathis",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe("hidden");
    const close = dialog.getByRole("button", {
      name: "Close project showcase",
    });
    await close.focus();
    await page.keyboard.press("Shift+Tab");
    // Chromium includes the scrollable dialog itself in sequential focus.
    await expect(dialog).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    // showModal makes the background inert, including programmatic focus.
    await trigger.evaluate((element: HTMLButtonElement) => element.focus());
    await expect(close).toBeFocused();
    if (closeWith === "Escape") await page.keyboard.press("Escape");
    else await close.click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe("auto");
  }
});

test("keeps the open artwork detail accessible and within the viewport", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#work");
  await page
    .getByRole("button", {
      name: "Explore The Architecture of Hidden Forces",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "The Architecture of Hidden Forces",
    exact: true,
  });
  await dialog.getByRole("button", { name: "Detail", exact: true }).click();
  const accessibility = await new AxeBuilder({ page })
    .include(".project-showcase")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  const dimensions = await dialog.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      overflow: element.scrollWidth - element.clientWidth,
      left: bounds.left,
      right: bounds.right,
      viewport: window.innerWidth,
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  expect(dimensions.overflow).toBeLessThanOrEqual(1);
  expect(dimensions.left).toBeGreaterThanOrEqual(0);
  expect(dimensions.right).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.pageOverflow).toBeLessThanOrEqual(1);
});
