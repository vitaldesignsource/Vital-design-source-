# Brand, imagery, and content provenance

The owner requested a fresh build using the previous site only as a reference. The original site at <https://vital-design-source.higgsfield.app> redirected public requests to authentication on October 18, 2026. Its connected-account source checkout was read to recover the owner's official assets, service direction, and six project destinations. No original-site changes were pushed or deployed.

## Official crest

`public/assets/brand/vital-original.jpg`, `vital-logo-original.webp`, `vital-logo-transparent.png`, and `vital-logo-light.png` were copied byte-for-byte from the reference source. The original artwork remains intact. The supplied light variant is used on the dark navigation background; the unaltered original WebP appears in the Studio section and footer. Favicons are proportionally resized versions of the original crest.

Do not replace the crest with a generated mark or redraw it. Retain the original master when making size variants.

## Hero

`source-assets/neural-master.png` is newly AI-generated, text-free concept artwork for the dark jade and liquid-chrome theme. It depicts intertwined liquid-chrome and jade-glass loops in a photorealistic composition. It is decorative artwork, not a replacement logo or a photograph of client work, and contains no client logos, interface mockups, awards, locations, or performance claims. Responsive `neural-640` and `neural-1280` AVIF and WebP derivatives are served locally in the hero and AI Design Lab. No large autoplay video is required.

The active social sharing image, `public/assets/og-neural.jpg`, combines that artwork, the supplied crest variant, and Vital Design Source copy. Run `npm run assets` to regenerate the active artwork derivatives, project previews, sharing image, and icons.

Earlier artwork remains in the repository for provenance but is no longer used by the active design:

- `source-assets/presence-master.png`: a generated vermilion folded aluminum sculpture against warm ivory plaster, with `presence-640` and `presence-1120` AVIF/WebP derivatives and `public/assets/og-editorial.jpg`.
- `source-assets/ribbon-master.png`: generated abstract silver-ribbon artwork, with `hero-*` derivatives and `public/assets/og-image.jpg`.

## AI Design Lab and motion

`src/components/DesignLab.tsx` presents curated Liquid chrome, Prismatic, and Editorial visual directions. Typed presets in `src/lib/design-directions.ts` supply the direction names, briefs, and material labels. Selecting a preset changes the composed artwork treatment and supporting copy; it does not generate an image, contact an AI model, or represent completed client work. The section describes human-directed AI-assisted image creation, motion exploration, and intelligent experiences as offered capabilities, with no invented client results.

`src/components/AmbientField.tsx` draws the decorative hero light field on a canvas. It targets 30 frames per second, caps device pixel ratio at 1.5, and suspends animation when offscreen, when the document is hidden, or when its motion setting is disabled. Hero and Design Lab motion controls initialize from the visitor’s reduced-motion preference and allow explicit pause or resume. The official crest remains separate from all generated concept imagery.

## Typography

Space Grotesk Variable and Instrument Serif italic replace the earlier Manrope typography. IBM Plex Mono remains the supporting typeface for labels and small details. All three active typefaces are self-hosted through Fontsource; their SIL Open Font License notices are retained in `public/licenses`. See [Third-party notices](third-party-notices.md) for package and license filenames.

## Portfolio

| Project                           | External destination                        | Preview source                                                                                                                                |
| --------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Aetherica Podcast                 | <https://aethericapodcast.com>              | Public website capture                                                                                                                        |
| The Architecture of Hidden Forces | <https://thearchitectureofhiddenforces.com> | Public site artwork, `/bg/threshold-arches-in-misted-vault.webp`; labeled project artwork/private release                                     |
| Astera Roofing                    | <https://asteraroofing.com>                 | Public website capture                                                                                                                        |
| Sky Mathis                        | <https://skymathis.com>                     | Public website capture                                                                                                                        |
| 3 Magi Press                      | <https://threemagipress.com>                | Public website capture; original `3magipress.com` redirects here                                                                              |
| PigeonShield                      | <https://pigeonshield.net>                  | Preview rendered from the owner's public [PigeonSheild repository](https://github.com/vitaldesignsource/PigeonSheild); labeled source preview |

Captures were made October 18, 2026. Hidden Forces uses a private release gate; no password was submitted. The reference site's misspelling `thearchetectureofhiddenforces.com` was corrected to the verified working domain. The reference’s `pigeonshield.com` returned a bot challenge; the owner’s public repository identifies `pigeonshield.net` as canonical, which was verified to return the matching public site. Its preview uses public repository HTML/CSS/assets instead. Project previews describe appearance and subject matter only, with no invented scope, testimonials, performance statistics, or outcomes.

`source-assets/projects/capture-log.json` retains the initial capture observations, including the private/challenge page titles; the two replacements above are deliberate. The capture script reads public pages only, blocks non-GET/HEAD requests, and uses the environment's trusted Node fetch transport. Review captures before replacing derivatives; gates and challenge screens should never silently overwrite final previews.

## Copy

Service copy describes offered capabilities. Project names, categories, destinations, and subject descriptions follow the reference. No claims of awards, client results, office locations, headcount, or verified registration marks are made. Do not add endorsements or metrics without owner-supplied evidence.
