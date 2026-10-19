import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ reducedMotion: "reduce" });

test("illustrative workflows expose every example and stage without sending an AI request", async ({
  page,
}) => {
  await page.goto("/#ai-in-practice");
  const workflow = page.locator("#ai-in-practice");
  const examples = workflow.getByRole("group", {
    name: "Workflow example",
    exact: true,
  });
  const stages = workflow.getByRole("group", {
    name: "Workflow stage",
    exact: true,
  });
  const output = workflow.locator("#workflow-output");
  const requests: string[] = [];
  const origin = new URL(page.url()).origin;
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== origin || url.pathname.startsWith("/api/")) {
      requests.push(`${request.method()} ${request.url()}`);
    }
  });

  await expect(
    workflow.getByText("Interactive demonstration", { exact: true }),
  ).toBeVisible();
  await expect(
    workflow.getByText("Illustrative examples. No AI request is sent.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(examples.getByRole("button")).toHaveCount(3);
  await expect(stages.getByRole("button")).toHaveCount(4);
  await expect(workflow.getByRole("status")).toHaveCount(1);
  await expect(output).toHaveAttribute(
    "aria-labelledby",
    "workflow-output-title",
  );
  const snapshots = new Set<string>();
  for (const example of [
    {
      id: "studio-inquiry",
      name: "Studio inquiry",
      source: "A new creative project",
      message: "independent ceramics studio",
      titles: [
        "Start with what you know.",
        "An idea, given structure.",
        "The questions that matter.",
        "A considered starting point.",
      ],
    },
    {
      id: "service-request",
      name: "Service request",
      source: "A recurring manual task",
      message: "shared inbox",
      titles: [
        "Start with what you know.",
        "A clearer workflow outline.",
        "Control stays with your team.",
        "Ready for a scoped discussion.",
      ],
    },
    {
      id: "content-handoff",
      name: "Content handoff",
      source: "Notes for a new collection",
      message: "four pieces in two finishes",
      titles: [
        "Start with what you know.",
        "A useful editorial outline.",
        "Facts before finishing touches.",
        "Organized for the next person.",
      ],
    },
  ]) {
    const option = examples.getByRole("button", {
      name: example.name,
      exact: true,
    });
    await option.click();
    await expect(option).toHaveAttribute("aria-pressed", "true");
    await expect(examples.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(workflow.locator(".workflow-source-label")).toHaveText(
      example.source,
    );
    await expect(workflow.locator(".workflow-source-message")).toContainText(
      example.message,
    );
    for (const [index, stage] of [
      "Capture",
      "Organize",
      "Review",
      "Handoff",
    ].entries()) {
      const choice = stages.getByRole("button", { name: stage, exact: true });
      await choice.focus();
      await page.keyboard.press("Enter");
      await expect(choice).toBeFocused();
      await expect(choice).toHaveAttribute("aria-pressed", "true");
      await expect(choice).toHaveAttribute("aria-controls", "workflow-output");
      await expect(stages.locator('[aria-pressed="true"]')).toHaveCount(1);
      await expect(output).toHaveAttribute("data-example", example.id);
      await expect(output).toHaveAttribute("data-stage", stage.toLowerCase());
      await expect(output).toBeVisible();
      await expect(
        workflow.getByRole("region", {
          name: example.titles[index],
          exact: true,
        }),
      ).toBeVisible();
      if (stage === "Capture")
        await expect(output).toContainText(example.source);
      snapshots.add((await output.innerText()).trim());
    }
  }
  expect(snapshots.size).toBe(12);
  const diagram = workflow.locator("svg.workflow-map");
  await expect(diagram).toHaveAttribute("aria-hidden", "true");
  await expect(diagram).toHaveAttribute("focusable", "false");
  await expect(
    diagram.locator("a, button, [tabindex]:not([tabindex='-1'])"),
  ).toHaveCount(0);
  expect(
    await diagram.evaluate(
      (element) => element.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0);
  await expect(
    workflow.getByRole("link", {
      name: "Discuss a workflow like this",
      exact: true,
    }),
  ).toHaveAttribute("href", "#contact");
  await page.setViewportSize({ width: 320, height: 800 });
  await workflow.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  const accessibility = await new AxeBuilder({ page })
    .include("#ai-in-practice")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  expect(requests).toEqual([]);
});

test("a chosen workflow reaches the inquiry with its context and preserves the visitor's draft", async ({
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
  await page.goto("/#contact");
  const name = page.getByLabel("Your name *", { exact: true });
  const email = page.getByLabel("Email address *", { exact: true });
  const type = page.getByLabel("What do you need?", { exact: true });
  const details = page.getByLabel("A little about your idea *", {
    exact: true,
  });
  const point = page.getByRole("region", {
    name: "Your starting point",
    exact: true,
  });
  const message =
    "We would like to organize incoming requests while keeping an editor involved in every decision.";
  await name.fill("Workflow Explorer");
  await email.fill("workflow-explorer@example.com");
  await details.fill(message);

  const workflow = page.locator("#ai-in-practice");
  const examples = workflow.getByRole("group", {
    name: "Workflow example",
    exact: true,
  });
  const discuss = workflow.getByRole("link", {
    name: "Discuss a workflow like this",
    exact: true,
  });
  await examples
    .getByRole("button", { name: "Service request", exact: true })
    .click();
  await discuss.click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(point).toContainText("Service request");
  await expect(type).toHaveValue("Intelligent automation");
  await expect(name).toHaveValue("Workflow Explorer");
  await expect(email).toHaveValue("workflow-explorer@example.com");
  await expect(details).toHaveValue(message);

  await type.selectOption("Website & development");
  await examples
    .getByRole("button", { name: "Content handoff", exact: true })
    .click();
  await discuss.click();
  await expect(point).toContainText("Content handoff");
  await expect(type).toHaveValue("Website & development");
  await expect(details).toHaveValue(message);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(page.locator(".form-success")).toBeFocused();

  expect(submissions).toHaveLength(1);
  expect(Object.keys(submissions[0]).sort()).toEqual([
    "budget",
    "company",
    "consent",
    "details",
    "email",
    "name",
    "type",
    "website",
  ]);
  expect(submissions[0].name).toBe("Workflow Explorer");
  expect(submissions[0].email).toBe("workflow-explorer@example.com");
  expect(submissions[0].type).toBe("Website & development");
  expect(submissions[0].details).toEqual(
    expect.stringContaining(`${message}\n`),
  );
  expect(submissions[0].details).toEqual(
    expect.stringContaining("Workflow example: Content handoff"),
  );
  expect(submissions[0].details).not.toEqual(
    expect.stringContaining("Service request"),
  );
});
