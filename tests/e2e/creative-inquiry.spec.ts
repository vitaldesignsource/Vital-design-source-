import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ reducedMotion: "reduce" });

test("creative starting points preserve a draft through selection, clearing, retry, and success", async ({
  page,
}, testInfo) => {
  test.setTimeout(45_000);
  const submissions: Record<string, unknown>[] = [];
  await page.route("**/api/inquiry", async (route) => {
    submissions.push(route.request().postDataJSON());
    if (submissions.length === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: "Temporary test interruption.",
        }),
      });
    } else {
      await route.continue();
    }
  });
  await page.goto("/#contact");
  const name = page.getByLabel("Your name *", { exact: true });
  const email = page.getByLabel("Email address *", { exact: true });
  const company = page.getByLabel("Company or project", { exact: true });
  const type = page.getByLabel("What do you need?", { exact: true });
  const budget = page.getByLabel("Estimated budget", { exact: true });
  const details = page.getByLabel("A little about your idea *", {
    exact: true,
  });
  const point = page.getByRole("region", {
    name: "Your starting point",
    exact: true,
  });
  const message =
    "We would like a considered website and visual identity for an independent publishing project.";
  const emailValue = `creative-handoff-${testInfo.project.name}@example.com`;
  await name.fill("Draft Preserver");
  await email.fill(emailValue);
  await company.fill("Independent Studio");
  await budget.selectOption("$5,000–$15,000");
  await details.fill(message);

  await page.getByRole("button", { name: "Prismatic", exact: true }).click();
  await page
    .getByRole("link", { name: "Explore this direction", exact: true })
    .click();
  await expect(point).toContainText("Prismatic");
  await expect(type).toHaveValue("AI design & motion");
  await expect(name).toHaveValue("Draft Preserver");
  await expect(email).toHaveValue(emailValue);
  await expect(company).toHaveValue("Independent Studio");
  await expect(budget).toHaveValue("$5,000–$15,000");
  await expect(details).toHaveValue(message);

  await type.selectOption("SEO & visibility");
  await page
    .getByRole("button", { name: "02 Development", exact: true })
    .click();
  await page
    .locator("#service-panel-1")
    .getByRole("link", { name: "Discuss this service" })
    .click();
  await expect(point).toContainText("Development");
  await expect(type).toHaveValue("SEO & visibility");
  await expect(details).toHaveValue(message);
  await page.getByRole("button", { name: "Clear starting point" }).click();
  await expect(point).toHaveCount(0);
  await expect(type).toBeFocused();
  await expect(type).toHaveValue("SEO & visibility");

  await page.getByRole("button", { name: "Editorial", exact: true }).click();
  await page
    .getByRole("link", { name: "Explore this direction", exact: true })
    .click();
  await expect(point).toContainText("Editorial");
  await expect(type).toHaveValue("SEO & visibility");
  await expect(details).toHaveValue(message);
  const accessibility = await new AxeBuilder({ page })
    .include("#contact")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Temporary test interruption.",
  );
  await expect(point).toContainText("Editorial");
  await expect(name).toHaveValue("Draft Preserver");
  await expect(email).toHaveValue(emailValue);
  await expect(company).toHaveValue("Independent Studio");
  await expect(type).toHaveValue("SEO & visibility");
  await expect(budget).toHaveValue("$5,000–$15,000");
  await expect(details).toHaveValue(message);
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/inquiry") && response.status() === 201,
  );
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await saved;
  await expect(page.locator(".form-success")).toBeFocused();
  expect(submissions).toHaveLength(2);
  expect(submissions[0]).toEqual(submissions[1]);
  expect(Object.keys(submissions[1]).sort()).toEqual([
    "budget",
    "company",
    "consent",
    "details",
    "email",
    "name",
    "type",
    "website",
  ]);
  expect(submissions[1].type).toBe("SEO & visibility");
  expect(submissions[1].budget).toBe("$5,000–$15,000");
  expect(submissions[1].details).toEqual(expect.stringContaining(message));
  expect(String(submissions[1].details).match(/Editorial/g)).toHaveLength(1);
  await page.getByRole("button", { name: "Send another inquiry" }).click();
  await expect(point).toHaveCount(0);
  await expect(name).toHaveValue("");
  await expect(email).toHaveValue("");
  await expect(details).toHaveValue("");
  await expect(type).toHaveValue("Website & development");
  await expect(budget).toHaveValue("Not sure yet");
});

test("a starting point cannot bypass message limits or silently truncate a draft", async ({
  page,
}) => {
  const submissions: Record<string, unknown>[] = [];
  await page.route("**/api/inquiry", async (route) => {
    submissions.push(route.request().postDataJSON());
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.goto("/#ai-studio");
  await page
    .getByRole("link", { name: "Explore this direction", exact: true })
    .click();
  const point = page.getByRole("region", {
    name: "Your starting point",
    exact: true,
  });
  const details = page.getByLabel("A little about your idea *", {
    exact: true,
  });
  await expect(point).toContainText("Liquid chrome");
  await page
    .getByLabel("Your name *", { exact: true })
    .fill("Boundary Reviewer");
  await page
    .getByLabel("Email address *", { exact: true })
    .fill("boundaries@example.com");
  await page.getByRole("checkbox").check();
  await details.fill("Short");
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(details).toBeFocused();
  await expect(details).toHaveAttribute("aria-invalid", "true");
  expect(submissions).toHaveLength(0);
  const fullMessage = "x".repeat(4000);
  await details.fill(fullMessage);
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(details).toBeFocused();
  await expect(details).toHaveAttribute("aria-invalid", "true");
  await expect(details).toHaveValue(fullMessage);
  await expect(point).toBeVisible();
  expect(submissions).toHaveLength(0);
  await page.getByRole("button", { name: "Clear starting point" }).click();
  await expect(details).toHaveValue(fullMessage);
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(page.locator(".form-success")).toBeFocused();
  expect(submissions).toHaveLength(1);
  expect(submissions[0].details).toBe(fullMessage);
});
