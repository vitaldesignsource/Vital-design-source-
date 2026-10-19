export type WorkflowStage = "capture" | "organize" | "review" | "handoff";

export interface WorkflowExample {
  readonly id: "studio-inquiry" | "service-request" | "content-handoff";
  readonly name: string;
  readonly summary: string;
  readonly focus: readonly string[];
  readonly input: {
    readonly label: string;
    readonly source: string;
    readonly message: string;
  };
  readonly brief: {
    readonly title: string;
    readonly fields: readonly {
      readonly label: string;
      readonly value: string;
    }[];
  };
  readonly review: {
    readonly title: string;
    readonly checks: readonly string[];
    readonly note: string;
  };
  readonly handoff: {
    readonly title: string;
    readonly items: readonly string[];
    readonly note: string;
  };
}

export const workflowExamples: readonly WorkflowExample[] = [
  {
    id: "studio-inquiry",
    name: "Studio inquiry",
    summary:
      "Shape an open-ended project inquiry into a useful creative starting point, with scope and priorities reviewed by a person.",
    focus: ["Inquiry structure", "Creative brief", "Human review"],
    input: {
      label: "A new creative project",
      source: "Example / inquiry form",
      message:
        "We’re opening an independent ceramics studio. We need a visual identity and a small online shop that feels quiet and tactile. We have product photographs, but the copy is still taking shape. We’re hoping to launch in eight weeks. Where do we start?",
    },
    brief: {
      title: "An idea, given structure.",
      fields: [
        { label: "Project", value: "Identity + small online shop" },
        { label: "Direction", value: "Quiet, tactile, product-led" },
        { label: "Available", value: "Product photography" },
        {
          label: "To clarify",
          value: "Copy, product catalog, budget, timeline",
        },
      ],
    },
    review: {
      title: "The questions that matter.",
      checks: [
        "Confirm the story, audience, and scope with the studio.",
        "Review photography, product information, and copy needs.",
        "Agree on priorities and a realistic launch plan.",
      ],
      note: "An eight-week request is a planning input, not a confirmed delivery date.",
    },
    handoff: {
      title: "A considered starting point.",
      items: [
        "A draft creative brief for the studio to approve.",
        "A list of content and commerce requirements to discuss.",
        "A proposed discovery conversation and next steps.",
      ],
      note: "Suggested handoff only. No inquiry is submitted or project scheduled by this demonstration.",
    },
  },
  {
    id: "service-request",
    name: "Service request",
    summary:
      "Turn a repetitive service request into a reviewed workflow outline, with permissions, exceptions, and ownership made explicit.",
    focus: ["Request routing", "Integration planning", "Human approval"],
    input: {
      label: "A recurring manual task",
      source: "Example / service email",
      message:
        "Every website inquiry lands in our shared inbox. Someone copies the contact details into a spreadsheet, figures out the request type, and forwards it to the right person. Could we make that easier without losing control of what gets sent?",
    },
    brief: {
      title: "A clearer workflow outline.",
      fields: [
        { label: "Trigger", value: "A new website inquiry" },
        { label: "Structure", value: "Contact details + request category" },
        { label: "Review point", value: "A person checks the suggested route" },
        { label: "To clarify", value: "Tools, access, exceptions, retention" },
      ],
    },
    review: {
      title: "Control stays with your team.",
      checks: [
        "Confirm which tools may receive contact information.",
        "Define who approves the route and handles uncertain requests.",
        "Review access, data retention, and duplicate handling.",
      ],
      note: "Sensitive information and ambiguous requests need an agreed handling process before a workflow is connected.",
    },
    handoff: {
      title: "Ready for a scoped discussion.",
      items: [
        "A workflow outline with an explicit approval step.",
        "An integration checklist for the tools already in use.",
        "A list of exceptions to test before any launch.",
      ],
      note: "Suggested handoff only. No inbox, spreadsheet, or external service is connected here.",
    },
  },
  {
    id: "content-handoff",
    name: "Content handoff",
    summary:
      "Organize scattered launch notes into a reviewed content outline, keeping factual checks and publishing decisions with your team.",
    focus: ["Content structure", "Editorial review", "Publishing handoff"],
    input: {
      label: "Notes for a new collection",
      source: "Example / content notes",
      message:
        "The new collection has four pieces in two finishes. We have photographs and care instructions. The product names are approved, but the descriptions need work. We need a collection page and a launch email. Pricing and availability are still being confirmed.",
    },
    brief: {
      title: "A useful editorial outline.",
      fields: [
        { label: "Content", value: "Collection page + launch email" },
        { label: "Source material", value: "Photos, names, care instructions" },
        { label: "Draft needs", value: "Introduction + product descriptions" },
        { label: "Unconfirmed", value: "Pricing + product availability" },
      ],
    },
    review: {
      title: "Facts before finishing touches.",
      checks: [
        "Check descriptions against the actual products and source notes.",
        "Confirm pricing, availability, and permitted claims.",
        "Approve the voice, image selection, and final copy.",
      ],
      note: "Missing details stay unconfirmed. They are never filled in as invented product facts.",
    },
    handoff: {
      title: "Organized for the next person.",
      items: [
        "A page and email outline with source material attached.",
        "A short list of facts still awaiting confirmation.",
        "A review checklist before the team publishes anything.",
      ],
      note: "Suggested handoff only. No copy is generated live, and nothing is published or emailed.",
    },
  },
];
