import { projectTypes, type services } from "./content";
import type { DesignDirection } from "./design-directions";
import type { WorkflowExample } from "./workflow-examples";

export type ProjectType = (typeof projectTypes)[number];
export type Service = (typeof services)[number];

export interface CreativeStartingPoint {
  readonly kind: "direction" | "service" | "workflow";
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  readonly focus: readonly string[];
  readonly projectType: ProjectType;
}

const serviceProjectTypes: Readonly<Record<string, ProjectType>> = {
  "Web design": "Website & development",
  Development: "Website & development",
  Branding: "Brand & identity",
  SEO: "SEO & visibility",
  "Intelligent automation": "Intelligent automation",
  "AI design & motion": "AI design & motion",
};

export function startingPointFromDirection(
  direction: DesignDirection,
): CreativeStartingPoint {
  return {
    kind: "direction",
    id: direction.id,
    label: direction.name,
    summary: direction.brief,
    focus: [...direction.materials],
    projectType: "AI design & motion",
  };
}

export function startingPointFromService(
  service: Service,
): CreativeStartingPoint {
  return {
    kind: "service",
    id: service.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label: service.title,
    summary: service.short,
    focus: [...service.details],
    projectType: serviceProjectTypes[service.title] ?? "Something else",
  };
}

export function startingPointFromWorkflow(
  example: WorkflowExample,
): CreativeStartingPoint {
  return {
    kind: "workflow",
    id: example.id,
    label: example.name,
    summary: example.summary,
    focus: [...example.focus],
    projectType: "Intelligent automation",
  };
}

export function detailsWithStartingPoint(
  details: string,
  point: CreativeStartingPoint | null,
): string {
  if (!point) return details;
  const labels = {
    direction: "Design direction",
    service: "Service",
    workflow: "Workflow example",
  } as const;
  return [
    details,
    "",
    "Starting point selected on the website:",
    `${labels[point.kind]}: ${point.label}`,
    point.summary,
    `Focus: ${point.focus.join(" / ")}`,
  ].join("\n");
}
