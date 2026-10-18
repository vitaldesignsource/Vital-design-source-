export interface DesignDirection {
  id: "chrome" | "prismatic" | "editorial";
  name: string;
  title: string;
  brief: string;
  materials: readonly string[];
}

export const designDirections = [
  {
    id: "chrome",
    name: "Liquid chrome",
    title: "Sculpted for the unexpected.",
    brief:
      "Fluid forms, reflective surfaces, and restrained jade light. A cinematic direction for a brand with a sharper edge.",
    materials: ["Liquid metal", "Jade light", "Soft motion"],
  },
  {
    id: "prismatic",
    name: "Prismatic",
    title: "A different kind of energy.",
    brief:
      "Iridescent color, light in motion, and expressive depth. An exploratory direction for brands that welcome a little wonder.",
    materials: ["Spectral color", "Refracted light", "Expressive depth"],
  },
  {
    id: "editorial",
    name: "Editorial",
    title: "Clarity, with character.",
    brief:
      "Graphic restraint, confident typography, and considered contrast. A composed direction that gives a strong idea room to breathe.",
    materials: ["Quiet contrast", "Graphic form", "Considered space"],
  },
] as const satisfies readonly DesignDirection[];
