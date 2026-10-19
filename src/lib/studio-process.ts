export const studioProcess = [
  {
    id: "discover",
    name: "Discover",
    cue: "Ask the right questions.",
    title: "Start with what matters.",
    objective:
      "Before choosing a visual direction, we get to know your business, your audience, and the idea you want to bring into the world.",
    focus: [
      "Clarify the purpose, audience, and priorities.",
      "Review your existing identity, content, and digital tools.",
      "Shape a focused brief and agree on the scope together.",
    ],
    collaboration:
      "Bring your ambitions, useful references, and any constraints. Your knowledge of the business gives the work its starting point.",
    artifact: "The creative brief",
    diagramLabel: "01 / Finding the focus",
  },
  {
    id: "design",
    name: "Design",
    cue: "Give the idea its character.",
    title: "Find a visual language.",
    objective:
      "We explore how your idea should look, feel, and behave, connecting the brand expression with the experience people will use.",
    focus: [
      "Explore typography, color, imagery, and composition.",
      "Map key pages and the journeys between them.",
      "Review concepts and develop the chosen direction.",
    ],
    collaboration:
      "Tell us what feels right and why. Shared references and specific feedback help turn a promising direction into a considered design.",
    artifact: "The visual direction",
    diagramLabel: "02 / Defining the language",
  },
  {
    id: "develop",
    name: "Develop",
    cue: "Connect every detail.",
    title: "Make the experience real.",
    objective:
      "Design becomes a working experience. We connect the interface, content, and relevant systems, with care for the details people see and those they never need to.",
    focus: [
      "Build responsive layouts and purposeful interactions.",
      "Connect forms, content, and agreed integrations.",
      "Consider accessibility, performance, and maintainability.",
    ],
    collaboration:
      "Review the working site and share real content where possible. We’ll identify any access or decisions needed for the agreed connections.",
    artifact: "The connected experience",
    diagramLabel: "03 / Bringing it together",
  },
  {
    id: "refine",
    name: "Refine",
    cue: "Make it feel intentional.",
    title: "Consider the finer points.",
    objective:
      "We look closely at the experience as a whole, reviewing the visual details, the way it works, and the practical steps needed to make it ready for use.",
    focus: [
      "Review layouts, content, and interactions across screen sizes.",
      "Check key journeys, links, and form behavior.",
      "Polish the details and prepare the agreed handover.",
    ],
    collaboration:
      "Walk through the experience with us, confirm the final content, and bring any remaining questions into the review before launch.",
    artifact: "The finishing details",
    diagramLabel: "04 / A considered finish",
  },
] as const;

export type StudioPhase = (typeof studioProcess)[number]["id"];
