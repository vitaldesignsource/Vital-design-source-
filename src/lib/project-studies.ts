export interface ProjectStudy {
  headline: string;
  introduction: string;
  previewKind: "website" | "artwork" | "cover";
  observations: readonly {
    title: string;
    description: string;
  }[];
}

export const projectStudies: Record<string, ProjectStudy> = {
  aetherica: {
    headline: "An atmosphere for deeper listening.",
    introduction:
      "A dark, contemplative visual world for conversations about philosophy and esoteric ideas.",
    previewKind: "website",
    observations: [
      {
        title: "A world in shadow and gold",
        description:
          "Ivory serif lettering and muted gold accents sit over a shadowed, candlelit interior.",
      },
      {
        title: "Listening in the foreground",
        description:
          "Listen and archive links lead into a slim audio player along the bottom edge of the composition.",
      },
    ],
  },
  "hidden-forces": {
    headline: "Architecture as an invitation.",
    introduction:
      "A closer look at the architectural artwork associated with The Architecture of Hidden Forces. The project is a private release.",
    previewKind: "artwork",
    observations: [
      {
        title: "Depth through repetition",
        description:
          "Weathered stone arches frame a dark, vaulted space, drawing the eye toward the threshold.",
      },
      {
        title: "Light as a focal point",
        description:
          "Low mist, overhead light, and a warm glow beyond the arch give the artwork its atmosphere.",
      },
    ],
  },
  astera: {
    headline: "A sharper visual structure.",
    introduction:
      "A roofing website preview that brings a technical visual language into a dramatic Arizona setting.",
    previewKind: "website",
    observations: [
      {
        title: "An architectural voice",
        description:
          "Angular white lettering contrasts with a dark mountain-and-rooftop backdrop.",
      },
      {
        title: "Detail with a clear next step",
        description:
          "A roofline drawing with technical annotations sits beside prominent inspection and phone links.",
      },
    ],
  },
  "sky-mathis": {
    headline: "A personal world, thoughtfully framed.",
    introduction:
      "A visual introduction to the independent research, publishing, and creative work of Sky Mathis.",
    previewKind: "website",
    observations: [
      {
        title: "Type meets geometry",
        description:
          "Large ivory serif type is paired with an intricate, fine-line geometric circle.",
      },
      {
        title: "A connected visual language",
        description:
          "Restrained gold details connect the dark landscape, navigation, and project links.",
      },
    ],
  },
  "3-magi": {
    headline: "A striking home for the written word.",
    introduction:
      "An independent publishing preview with an editorial composition and a classical visual vocabulary.",
    previewKind: "website",
    observations: [
      {
        title: "An editorial silhouette",
        description:
          "An oversized, three-line serif title balances a monochrome classical statue.",
      },
      {
        title: "Contrast with restraint",
        description:
          "A near-black canvas, ivory lettering, and clearly outlined book links keep the composition sharply defined.",
      },
    ],
  },
  pigeonshield: {
    headline: "A clear, unmistakable service presence.",
    introduction:
      "A website source preview for a specialized pigeon-prevention brand, grounded in an Arizona setting.",
    previewKind: "website",
    observations: [
      {
        title: "A direct visual language",
        description:
          "Bold white type and yellow accents stand against a deep blue palette.",
      },
      {
        title: "The service in its setting",
        description:
          "Balcony netting, palms, and mountain views fill the background behind the inspection links.",
      },
    ],
  },
  "ocean-ember": {
    headline: "A warmer way to discover light.",
    introduction:
      "A salt-lamp discovery website with product guides and direct links to retailers.",
    previewKind: "website",
    observations: [
      {
        title: "Warmth through contrast",
        description:
          "Cream backgrounds and forest-green typography frame a terracotta accent in the headline.",
      },
      {
        title: "Light in its setting",
        description:
          "A glowing salt lamp fills the lifestyle image beside the introduction and product-discovery links.",
      },
    ],
  },
  "7-seas-trading": {
    headline: "A world of discoveries, thoughtfully collected.",
    introduction:
      "An editorial discovery guide to regional foods and shoreline finds, with original product names, English descriptions, and direct links to sellers.",
    previewKind: "website",
    observations: [
      {
        title: "An editorial sense of place",
        description:
          "Forest-green serif lettering, teal italics, and fine gold rules sit on a warm ivory canvas.",
      },
      {
        title: "From destination to discovery",
        description:
          "A framed Italian coastal photograph is paired with an overlaid pasta discovery card, connecting the place with a find from the collection.",
      },
    ],
  },
};
