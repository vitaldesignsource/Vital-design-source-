export const projectTypes = [
  "Website & development",
  "Brand & identity",
  "AI design & motion",
  "SEO & visibility",
  "Intelligent automation",
  "Something else",
] as const;
export const budgets = [
  "Not sure yet",
  "Under $2,500",
  "$2,500–$5,000",
  "$5,000–$15,000",
  "$15,000+",
] as const;

export interface Project {
  id: string;
  name: string;
  category: string;
  group: "Culture & ideas" | "Brands & business";
  url: string;
  description: string;
  image: string;
  previewLabel?: string;
}

export const projects: Project[] = [
  {
    id: "aetherica",
    name: "Aetherica Podcast",
    category: "Podcast & media",
    group: "Culture & ideas",
    url: "https://aethericapodcast.com",
    description:
      "A home for conversations at the intersection of philosophy, esotericism, and ideas.",
    image: "aetherica",
  },
  {
    id: "hidden-forces",
    name: "The Architecture of Hidden Forces",
    category: "Publishing & education",
    group: "Culture & ideas",
    url: "https://thearchitectureofhiddenforces.com",
    description:
      "An exploration of metaphysical architecture and the principles that shape it.",
    image: "hidden-forces",
    previewLabel: "Project artwork · private release",
  },
  {
    id: "astera",
    name: "Astera Roofing",
    category: "Home services",
    group: "Brands & business",
    url: "https://asteraroofing.com",
    description: "A distinct digital presence for a roofing company.",
    image: "astera",
  },
  {
    id: "sky-mathis",
    name: "Sky Mathis",
    category: "Personal brand",
    group: "Brands & business",
    url: "https://skymathis.com",
    description:
      "An individual creative presence, with a digital identity to match.",
    image: "sky-mathis",
  },
  {
    id: "3-magi",
    name: "3 Magi Press",
    category: "Independent publishing",
    group: "Culture & ideas",
    url: "https://threemagipress.com",
    description: "A digital home for independent publishing and ideas.",
    image: "3-magi",
  },
  {
    id: "pigeonshield",
    name: "PigeonShield",
    category: "Specialty services",
    group: "Brands & business",
    url: "https://pigeonshield.net",
    description: "A focused web presence for a specialized service brand.",
    image: "pigeonshield",
    previewLabel: "Website source preview",
  },
];

export const services = [
  {
    title: "Web design",
    short: "A presence with purpose.",
    description:
      "Distinctive digital experiences shaped around your brand and the people you want to reach. From the first wireframe to the smallest interaction.",
    details: ["Creative direction", "UX & UI design", "Responsive experiences"],
  },
  {
    title: "Development",
    short: "Craft, all the way down.",
    description:
      "Thoughtful engineering that brings the design to life. Accessible, maintainable websites and custom integrations, built to work beautifully across devices.",
    details: [
      "React & custom websites",
      "E-commerce & integrations",
      "Performance & accessibility",
    ],
  },
  {
    title: "Branding",
    short: "Unmistakably you.",
    description:
      "A coherent visual language that gives your business a recognizable identity. Strong foundations and practical tools for everything that follows.",
    details: ["Visual identity", "Art direction", "Brand systems & guidelines"],
  },
  {
    title: "SEO",
    short: "Built to be discovered.",
    description:
      "Search-ready foundations that help people find and understand your business. Clear structure, useful content, and the technical details that support visibility.",
    details: [
      "Technical SEO",
      "Content structure",
      "Metadata & structured data",
    ],
  },
  {
    title: "Intelligent automation",
    short: "More room for what matters.",
    description:
      "Connected tools and considered AI workflows that take friction out of everyday work. Practical systems designed around how your business actually operates.",
    details: [
      "Workflow design",
      "Connected business tools",
      "AI-assisted operations",
    ],
  },
  {
    title: "AI design & motion",
    short: "Imagination, thoughtfully directed.",
    description:
      "AI-assisted art direction for campaign imagery, motion concepts, and visual exploration. Human creative direction, review, and refinement guide the work from the first brief to the selected visuals, with your brand and its intended use in focus.",
    details: [
      "AI-assisted art direction",
      "Campaign imagery",
      "Motion & visual exploration",
    ],
  },
];
