# Brand, imagery, and content provenance

The owner requested a fresh build using the previous site only as a reference. The original site at <https://vital-design-source.higgsfield.app> redirected public requests to authentication on October 18, 2026. Its connected-account source checkout was read to recover the owner's official assets, service direction, and six project destinations. No original-site changes were pushed or deployed.

## Official crest

`public/assets/brand/vital-original.jpg`, `vital-logo-original.webp`, `vital-logo-transparent.png`, and `vital-logo-light.png` were copied byte-for-byte from the reference source and remain unchanged. The unaltered original WebP appears in the Studio section and footer. The social image uses the supplied light variant, and favicons are proportionally resized versions of the original crest.

The owner subsequently requested a more impressive animated SVG treatment. That explicit direction supersedes the earlier no-redraw guidance for the new refinement below; the four original files remain preserved.

## Refined SVG crest

`source-assets/crest-refined-master.png` is an AI-assisted refinement that retains the recognizable VDS shield and ascending wings. Its artwork was converted to thresholded alpha and traced with VTracer 0.6.15. The resulting `source-assets/brand/crest-refined-vector.svg` and `src/lib/crest-geometry.json` contain actual vector paths, rather than an embedded bitmap. This refinement is distinct from the untouched original artwork.

`src/components/BrandCrest.tsx` uses the checked-in geometry as an inline SVG in navigation. Each instance receives unique gradient, shape, and clipping IDs. The filled crest is visible on first paint; a finite shield reveal and silver highlight settle in about 1.6 seconds, with another brief highlight on hover or focus. `src/styles/brand.css` disables these animations for the system reduced-motion preference and retains the static filled crest.

`scripts/brand-assets.ts` produces these transparent-background exports in `public/assets/brand`:

| File                       | Treatment                                                        |
| -------------------------- | ---------------------------------------------------------------- |
| `vital-crest.svg`          | Static ink crest                                                 |
| `vital-crest-silver.svg`   | Static metallic silver crest                                     |
| `vital-crest-animated.svg` | Filled silver crest with a finite SMIL reveal and highlight      |
| `vital-lockup.svg`         | Silver crest and outlined Space Grotesk / IBM Plex Mono wordmark |

The standalone SVGs contain no external fonts, images, or scripts. `source-assets/brand/wordmark-paths.json` retains the glyph outlines used by the lockup, and the typefaces’ licenses remain in `public/licenses`. The animation completes once rather than looping indefinitely.

The brand preview at `/assets/brand/preview.html` uses an external stylesheet, `preview.css`, and a `<picture>` source that selects the static silver crest for reduced-motion visitors. When embedding the standalone animated SVG elsewhere, provide the same static alternative; the live navigation component handles reduced motion through CSS.

Run `npm run assets:brand` to regenerate the exports from the checked-in crest and wordmark paths. `npm run assets` includes this step. Neither normal builds nor export generation requires Python. For future edits to the raster master or outlined lettering, the optional `scripts/trace-brand.py` helper uses Python with Pillow, VTracer 0.6.15, fontTools, and Brotli to recreate the source vector data before export generation.

## Three-dimensional hero crest

The hero uses `src/components/CrestSculpture.tsx` and the code-split `src/lib/crest-scene.ts` to turn the checked-in `crest-geometry.json` paths into actual Three.js extruded, beveled meshes. Silver faces and green-tinted edges preserve the refined shield and wings as a dimensional identity. The scene does not use the earlier concept artwork as a substitute for the crest.

Cap triangles stay geometrically planar to avoid visible triangulation seams in broad silver reflections. Crease-aware smoothing applies to the six-segment bevels, while cap normals are restored independently. A continuous, shallow crown in the surface normals gives the metal softer reflections without bending the cap triangles or changing the checked-in vector paths. Outline tessellation uses a modest `curveSegments: 8`.

The reflective studio environment is generated locally from a canvas gradient and light panels, then filtered through Three.js’s PMREM environment generator. Key, rim, and hemisphere lights complete the scene. No external environment map, texture, model, or image request is required for this rendering.

The static silver SVG remains visible on first paint and until the optional WebGL scene has rendered. The scene module is loaded dynamically; data-saving connections skip that enhancement. Failed loading or unavailable WebGL leaves the SVG in place, and context loss restores it. Normal builds use the committed vector geometry and require no tracing or Python step.

When motion is enabled, pointer position gently changes the crest’s orientation and its key and rim lighting. Animation is limited to 30 frames per second. On resize, rendering density is recomputed as `min(devicePixelRatio, 2.5, sqrt(2,400,000 / (width × height)))`, using the crest element’s CSS width and height. This resolves fine heraldic details on high-density screens while keeping the drawing buffer within a 2.4-megapixel budget on larger displays. The hero’s pause control stops pointer-driven motion; the initial state respects the system reduced-motion preference and remains stationary until motion is enabled. The renderer sleeps once the pointer settles, suspends animation while offscreen or while the document is hidden, and releases its geometry, materials, environment, and renderer resources on unmount.

## AI concept artwork

`source-assets/neural-master.png` is newly AI-generated, text-free concept artwork for the dark jade and liquid-chrome theme. It depicts intertwined liquid-chrome and jade-glass loops in a photorealistic composition. It is decorative artwork, not a replacement logo or a photograph of client work, and contains no client logos, interface mockups, awards, locations, or performance claims. The artwork appears in the AI Design Lab, with local `neural-640` and `neural-1280` AVIF and WebP derivatives retained in the asset set. The hero now uses the vector-derived dimensional crest described above. No large autoplay video is required.

The active social sharing image, `public/assets/og-vital.jpg`, pairs the silver vector crest with an obsidian background, restrained jade light, platinum typography, the supplied crest variant, and Vital Design Source copy. It is composed from local brand assets. Its typography uses checked-in glyph outlines in `source-assets/brand/social-lettering.json`, derived from the same bundled Space Grotesk and IBM Plex Mono fonts as the site, so rendering does not depend on system font availability. The optional `scripts/outline-social.py` helper regenerates those outlines with fontTools and Brotli; normal asset builds require no Python. The earlier `og-neural.jpg` preview remains in the repository for provenance. Run `npm run assets` to regenerate the active artwork derivatives, project previews, sharing image, and icons.

Earlier artwork remains in the repository for provenance but is no longer used by the active design:

- `source-assets/presence-master.png`: a generated vermilion folded aluminum sculpture against warm ivory plaster, with `presence-640` and `presence-1120` AVIF/WebP derivatives and `public/assets/og-editorial.jpg`.
- `source-assets/ribbon-master.png`: generated abstract silver-ribbon artwork, with `hero-*` derivatives and `public/assets/og-image.jpg`.

## AI Design Lab and motion

`src/components/DesignLab.tsx` presents curated Liquid chrome, Prismatic, and Editorial visual directions. Typed presets in `src/lib/design-directions.ts` supply the direction names, briefs, and material labels. Selecting a preset changes the composed artwork treatment and supporting copy; it does not generate an image, contact an AI model, or represent completed client work. The section describes human-directed AI-assisted image creation, motion exploration, and intelligent experiences as offered capabilities, with no invented client results.

The Design Lab motion controls initialize from the visitor’s reduced-motion preference and allow explicit pause or resume. `src/components/AmbientField.tsx`, the earlier decorative canvas light field, remains in the repository but is no longer mounted in the hero. The Lab concept artwork remains separate from the brand crest assets.

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
| OceanEmber                        | <https://oceanember.net>                    | Public website capture of the salt-lamp discovery site; captured October 18, 2026                                                             |
| 7 Seas Trading                    | <https://7seastrading.net>                  | Clearly labeled typographic project cover; public URL currently returns HTTP 403                                                              |

Captures were made October 18, 2026. Hidden Forces uses a private release gate; no password was submitted. The reference site's misspelling `thearchetectureofhiddenforces.com` was corrected to the verified working domain. The reference’s `pigeonshield.com` returned a bot challenge; the owner’s public repository identifies `pigeonshield.net` as canonical, which was verified to return the matching public site. Its preview uses public repository HTML/CSS/assets instead. Project previews describe appearance and subject matter only, with no invented scope, testimonials, performance statistics, or outcomes.

`source-assets/projects/capture-log.json` retains the initial capture observations, including the private/challenge page titles; the two replacements above are deliberate. The capture script reads public pages only, blocks non-GET/HEAD requests, and uses the environment's trusted Node fetch transport. Review captures before replacing derivatives; gates and challenge screens should never silently overwrite final previews.

### Project visual studies

`src/components/ProjectShowcase.tsx` presents a closer look at each portfolio entry with an available preview. Its Desktop view uses the same locally stored website capture as the portfolio card. The Detail control crops that same source image; it is not a separate screen capture or an additional project deliverable. The Hidden Forces study labels its full view Artwork and identifies the private release. PigeonShield retains the website source preview disclosure.

`src/lib/project-studies.ts` contains the studies’ introductions and visual observations. These describe visible typography, color, composition, and imagery only. They do not assert Vital Design Source’s project scope, process, performance, or client outcomes. External website links remain available alongside the studies. 7 Seas Trading uses a labeled project cover instead of a website screenshot because the supplied apex and www addresses returned HTTP 403. The source cover SVG and PNG are retained; it identifies the project by name and makes no claim about its website design or business. The cover view omits the Detail control and visual-study observations. Its supplied external URL remains unchanged. The native modal supports close and Escape behavior, returns focus to its trigger, and allows previous/next project navigation.

## Copy

Service copy describes offered capabilities. Project names, categories, destinations, and subject descriptions follow the reference. No claims of awards, client results, office locations, headcount, or verified registration marks are made. Do not add endorsements or metrics without owner-supplied evidence.

## Current color system

The site uses shared roles in `src/styles.css`: obsidian `#090d0c` for the ground, platinum `#e0e6df` for primary actions and silver identity, deep jade `#142c21` for atmospheric depth, sage `#b8d9c3` for selected states, and warm ivory `#ecece3` for editorial contrast. Services and project-study stories use dark jade text on ivory. Project imagery keeps its authentic source colors inside restrained tonal frames. Form borders use a separate higher-contrast control token; text, focus, selected, and hover treatments remain consistent across the main site and project dialogs. The downloadable vector exports, 3D studio reflections, brand preview page, and social image follow the same palette.
