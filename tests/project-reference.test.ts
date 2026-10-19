import { describe, expect, it } from "vitest";
import { projects } from "../src/lib/content";
import { getProjectReference } from "../src/lib/project-reference";
import {
  detailsWithStartingPoint,
  startingPointFromProject,
} from "../src/lib/creative-starting-point";

describe("project references", () => {
  it("resolves each public project ID without accepting other URL data", () => {
    for (const project of projects) {
      expect(
        getProjectReference(`?campaign=studio&reference=${project.id}`),
      ).toBe(project);
    }
  });

  it.each([
    "",
    "?reference=",
    "?reference=unknown",
    "?reference=aetherica&reference=aetherica",
    "?reference=aetherica&reference=astera",
    "?reference=%3Cscript%3Ealert(1)%3C%2Fscript%3E",
  ])("ignores absent, unsupported, or ambiguous references: %s", (search) => {
    expect(getProjectReference(search)).toBeUndefined();
  });

  it("composes the known reference with the visitor's own message", () => {
    const project = projects[0];
    const point = startingPointFromProject(project);
    const draft = "I am interested in a warm, considered publishing website.";
    const details = detailsWithStartingPoint(draft, point);
    expect(point).toMatchObject({
      kind: "project",
      id: project.id,
      label: project.name,
      summary: project.description,
      focus: [project.category],
      projectType: "Website & development",
    });
    expect(details).toContain(draft);
    expect(details).toContain(`Project reference: ${project.name}`);
    expect(details.match(/Project reference:/g)).toHaveLength(1);
  });
});
