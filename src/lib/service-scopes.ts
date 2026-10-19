export interface ServiceScope {
  readonly summary: string;
  readonly startingPoint: string;
  readonly details: readonly [string, string, string];
  readonly example?: {
    readonly href: "#ai-studio" | "#ai-in-practice";
    readonly label: string;
  };
}

type ServiceTitle = (typeof services)[number]["title"];

export const serviceScopes: Readonly<Record<ServiceTitle, ServiceScope>> = {
  "Web design": {
    summary: "UX, visual direction & responsive layouts",
    startingPoint:
      "A new website, or an existing one that needs a clearer structure and a more distinctive visual direction.",
    details: [
      "A visual direction grounded in your brand and the people you want to reach.",
      "Page structure, user journeys, and interface layouts that give the content a clear place.",
      "Layouts and interaction details considered across different screen sizes.",
    ],
  },
  Development: {
    summary: "Custom websites, integrations & accessible interactions",
    startingPoint:
      "Designs ready to build, or a website that needs a more considered technical foundation.",
    details: [
      "A maintainable component and content structure for the website you need.",
      "Forms, commerce features, and connections to the tools your project calls for.",
      "Responsive behavior, keyboard access, and performance considered throughout the build.",
    ],
  },
  Branding: {
    summary: "Identity, art direction & practical brand systems",
    startingPoint:
      "A new venture, an evolving identity, or a visual language that needs greater consistency.",
    details: [
      "A recognizable identity with considered typography, color, and graphic elements.",
      "A coherent approach to imagery, composition, and the way your brand shows up.",
      "Practical guidance and application examples for using the identity consistently.",
    ],
  },
  SEO: {
    summary: "Technical foundations, content structure & metadata",
    startingPoint:
      "A website whose information, content, or technical setup needs to be clearer for people and search engines.",
    details: [
      "A review of the technical foundations that affect crawling and indexing.",
      "Page hierarchy and content priorities shaped around what visitors need to understand.",
      "Page descriptions, sharing metadata, and relevant structured data.",
    ],
  },
  "Intelligent automation": {
    summary: "Workflow mapping, connected tools & reviewed AI assistance",
    startingPoint:
      "A recurring task that involves copying information, coordinating tools, or reviewing similar requests.",
    details: [
      "Triggers, routing, review checkpoints, and the exceptions that need a person.",
      "An integration approach based on your existing tools, access, and data requirements.",
      "AI-assisted steps with clear review, permissions, and handoff responsibilities.",
    ],
    example: {
      href: "#ai-in-practice",
      label: "Explore an illustrative workflow",
    },
  },
  "AI design & motion": {
    summary: "Human-directed imagery, motion & visual exploration",
    startingPoint:
      "A campaign, brand, or digital experience that needs an expressive visual direction to explore.",
    details: [
      "A creative brief and visual references to guide the exploration.",
      "Image concepts considered for the campaign, brand, and intended use.",
      "Motion concepts and selected visuals shaped through human review and refinement.",
    ],
    example: {
      href: "#ai-studio",
      label: "Explore illustrative visual directions",
    },
  },
};
import type { services } from "./content";
