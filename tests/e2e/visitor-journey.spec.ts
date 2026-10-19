import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ reducedMotion: "reduce" });

const startingPoint = (page: Page) =>
  page.getByRole("region", { name: "Your starting point", exact: true });

async function expectNoStoredDraft(page: Page) {
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
}

async function capacity(counter: Locator) {
  const text = await counter.innerText();
  const match = text.match(/^([\d,]+) \/ 4,000 characters/);
  expect(match).not.toBeNull();
  return Number(match![1].replaceAll(",", ""));
}

test("takes a gallery project into a removable inquiry reference without losing a draft", async ({
  page,
}) => {
  const submissions: unknown[] = [];
  await page.route("**/api/inquiry", async (route) => {
    submissions.push(route.request().postDataJSON());
    await route.fulfill({ status: 503, json: { ok: false } });
  });
  await page.goto("/#work");
  const project = page.locator(".project-7-seas-trading");
  const study = project.getByRole("link", {
    name: "View 7 Seas Trading project study",
    exact: true,
  });
  await expect(study).toHaveAttribute("href", "/work/7-seas-trading");
  await expect(study).not.toHaveAttribute("target", "_blank");
  const website = project.getByRole("link", {
    name: "Visit 7 Seas Trading (opens in a new tab)",
    exact: true,
  });
  await expect(website).toHaveAttribute("href", "https://7seastrading.net");
  await expect(website).toHaveAttribute("target", "_blank");
  await expect(website).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(website).toHaveAttribute("rel", /\bnoreferrer\b/);
  await expect(
    project.getByRole("button", {
      name: "Explore 7 Seas Trading",
      exact: true,
    }),
  ).toBeVisible();
  await study.click();
  await expect(page).toHaveURL(/\/work\/7-seas-trading$/);
  const reference = page.getByRole("link", {
    name: "Use this project as a reference",
    exact: true,
  });
  await expect(reference).toHaveAttribute(
    "href",
    "/?reference=7-seas-trading#contact",
  );
  await reference.click();
  await expect(page).toHaveURL(/\/#contact$/);
  await expect(startingPoint(page)).toContainText("7 Seas Trading");
  await expect(startingPoint(page)).toContainText("Project reference");
  await expect(
    page.getByLabel("What do you need?", { exact: true }),
  ).toHaveValue("Website & development");
  const name = page.getByLabel("Your name *", { exact: true });
  const email = page.getByLabel("Email address *", { exact: true });
  const details = page.getByLabel("A little about your idea *", {
    exact: true,
  });
  const draft =
    "We are exploring a thoughtful visual identity for an independent discovery publication.";
  await name.fill("Journey Reviewer");
  await email.fill("journey-review@example.com");
  await details.fill(draft);
  await page
    .getByLabel("What do you need?", { exact: true })
    .selectOption("Brand & identity");
  await page
    .getByRole("button", { name: "Clear starting point", exact: true })
    .click();
  await expect(startingPoint(page)).toHaveCount(0);
  await expect(name).toHaveValue("Journey Reviewer");
  await expect(email).toHaveValue("journey-review@example.com");
  await expect(details).toHaveValue(draft);
  await expect(
    page.getByLabel("What do you need?", { exact: true }),
  ).toHaveValue("Brand & identity");
  await expect(
    page.getByLabel("What do you need?", { exact: true }),
  ).toBeFocused();
  await expect(page.locator(".inquiry-message-capacity")).toContainText(
    `${draft.length} / 4,000 characters`,
  );
  await expectNoStoredDraft(page);
  expect(submissions).toEqual([]);
});

test("consumes only an unambiguous known project reference and preserves unrelated URL state", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Query allowlisting is independent of viewport.");
  const rejected = [
    "reference=unknown-reference-marker",
    "reference=aetherica&reference=astera",
    "reference=%3Cscript%3Euntrusted-reference-marker%3C%2Fscript%3E",
  ];
  for (const query of rejected) {
    await page.goto(`/?utm_source=journey-review&${query}#contact`);
    await expect(page).toHaveURL(/\/\?utm_source=journey-review#contact$/);
    await expect(startingPoint(page)).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(
      "unknown-reference-marker",
    );
    await expect(page.locator("body")).not.toContainText(
      "untrusted-reference-marker",
    );
    await expect(page.getByLabel("Your name *", { exact: true })).toHaveValue(
      "",
    );
    await expect(
      page.getByLabel("A little about your idea *", { exact: true }),
    ).toHaveValue("");
    await expectNoStoredDraft(page);
  }
  await page.goto("/?utm_source=journey-review&reference=aetherica#contact");
  await expect(page).toHaveURL(/\/\?utm_source=journey-review#contact$/);
  await expect(startingPoint(page)).toContainText("Aetherica Podcast");
  await page.reload();
  await expect(startingPoint(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/\?utm_source=journey-review#contact$/);
});

test("counts the exact composed message, corrects flagged fields on blur, and opens privacy without losing work", async ({
  page,
}) => {
  const submissions: Record<string, unknown>[] = [];
  await page.route("**/api/inquiry", async (route) => {
    submissions.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, json: { ok: true } });
  });
  await page.goto("/?reference=ocean-ember#contact");
  await expect(startingPoint(page)).toContainText("OceanEmber");
  const name = page.getByLabel("Your name *", { exact: true });
  const email = page.getByLabel("Email address *", { exact: true });
  const details = page.getByLabel("A little about your idea *", {
    exact: true,
  });
  const counter = page.locator(".inquiry-message-capacity");
  await expect(counter).toContainText("Includes your selected starting point.");
  const emptyContextLength = await capacity(counter);
  expect(emptyContextLength).toBeGreaterThan(0);
  // An actual message separates the selected reference with two newlines;
  // an empty message has no leading whitespace after final schema trimming.
  const contextLength = emptyContextLength + 2;
  await name.fill("Capacity Reviewer");
  await email.fill("not-an-email");
  await details.fill("Short");
  await name.focus();
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
  await expect(details).not.toHaveAttribute("aria-invalid", "true");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(details).toHaveAttribute("aria-invalid", "true");
  expect(submissions).toEqual([]);
  await email.fill("capacity-review@example.com");
  await details.focus();
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
  const draft =
    "   A considered product-discovery website for a small independent brand, with a clear editorial direction.   ";
  await details.fill(draft);
  await name.focus();
  await expect(details).not.toHaveAttribute("aria-invalid", "true");
  await expect
    .poll(() => capacity(counter))
    .toBe(contextLength + draft.trim().length);
  await expect(details).toHaveValue(draft);

  const privacy = page.locator(".consent-privacy").getByRole("link", {
    name: "privacy notice (opens in a new tab)",
    exact: true,
  });
  await expect(privacy).toHaveAttribute("target", "_blank");
  await expect(privacy).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(privacy).toHaveAttribute("rel", /\bnoreferrer\b/);
  const popupPromise = page.waitForEvent("popup");
  await privacy.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/\/privacy$/);
  await expect(
    popup.getByRole("heading", {
      level: 1,
      name: "Privacy notice",
      exact: true,
    }),
  ).toBeVisible();
  await popup.close();
  await expect(page).toHaveURL(/\/#contact$/);
  await expect(name).toHaveValue("Capacity Reviewer");
  await expect(email).toHaveValue("capacity-review@example.com");
  await expect(details).toHaveValue(draft);
  await expect(startingPoint(page)).toContainText("OceanEmber");
  await expectNoStoredDraft(page);
  expect(submissions).toEqual([]);

  const maximumDraft = "x".repeat(4000);
  await details.fill(maximumDraft);
  await expect.poll(() => capacity(counter)).toBe(4000 + contextLength);
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(details).toHaveAttribute("aria-invalid", "true");
  await expect(details).toHaveValue(maximumDraft);
  expect(submissions).toEqual([]);
  const exactDraft = "x".repeat(4000 - contextLength);
  await details.fill(exactDraft);
  await name.focus();
  await expect(details).not.toHaveAttribute("aria-invalid", "true");
  await expect.poll(() => capacity(counter)).toBe(4000);
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(page.locator(".form-success")).toBeFocused();
  expect(submissions).toHaveLength(1);
  expect(String(submissions[0].details)).toHaveLength(4000);
  expect(String(submissions[0].details).startsWith(`${exactDraft}\n\n`)).toBe(
    true,
  );
  expect(String(submissions[0].details)).toContain(
    "Project reference: OceanEmber",
  );
});

test("explains collapsed service scopes and carries a chosen service into a clear inquiry", async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/#contact");
  const draft =
    "We would like to improve the structure and discoverability of an independent publishing website.";
  await page
    .getByLabel("Your name *", { exact: true })
    .fill("Service Reviewer");
  await page
    .getByLabel("A little about your idea *", { exact: true })
    .fill(draft);
  for (const [index, label] of [
    "Web design",
    "Development",
    "Branding",
    "SEO",
    "Intelligent automation",
    "AI design & motion",
  ].entries()) {
    const button = page.getByRole("button", {
      name: `0${index + 1} ${label}`,
      exact: true,
    });
    const scope = button.locator(".service-scope");
    await button.scrollIntoViewIfNeeded();
    await expect(scope).toBeVisible();
    await expect(scope).not.toBeEmpty();
    await expect(button).toHaveAccessibleDescription(
      (await scope.innerText()).trim(),
    );
    if (index > 0)
      await expect(page.locator(`#service-panel-${index}`)).toBeHidden();
  }
  const seo = page.getByRole("button", { name: "04 SEO", exact: true });
  await expect(seo).toHaveAttribute("aria-expanded", "false");
  await seo.focus();
  await page.keyboard.press("Enter");
  const panel = page.locator("#service-panel-3");
  await expect(panel).toBeVisible();
  await expect(
    panel.getByRole("heading", {
      name: "A useful starting point",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    panel.getByRole("heading", { name: "What we shape together", exact: true }),
  ).toBeVisible();
  await expect(panel.locator(".service-details li")).toHaveCount(3);
  await expect(panel.locator(".service-details li p")).toHaveCount(3);
  await panel
    .getByRole("link", { name: "Discuss this service", exact: true })
    .click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(startingPoint(page)).toContainText("SEO");
  await expect(
    page.getByLabel("What do you need?", { exact: true }),
  ).toHaveValue("SEO & visibility");
  await expect(page.getByLabel("Your name *", { exact: true })).toHaveValue(
    "Service Reviewer",
  );
  await expect(
    page.getByLabel("A little about your idea *", { exact: true }),
  ).toHaveValue(draft);
  for (const question of [
    "Do I need a finished brief?",
    "Can I combine services?",
    "How are my details used?",
  ]) {
    const summary = page
      .locator("#contact summary")
      .filter({ hasText: question });
    await summary.click();
    await expect(summary.locator("..")).toHaveAttribute("open", "");
  }
  const accessibility = await new AxeBuilder({ page })
    .include("#contact")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await expectNoStoredDraft(page);
});
