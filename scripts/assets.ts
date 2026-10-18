import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { projects } from "../src/lib/content";

await mkdir("public/assets/projects", { recursive: true });
for (const width of [960, 1600]) {
  const image = sharp("source-assets/ribbon-master.png").resize({ width });
  await image
    .clone()
    .avif({ quality: 60 })
    .toFile(`public/assets/hero-${width}.avif`);
  await image
    .clone()
    .webp({ quality: 83 })
    .toFile(`public/assets/hero-${width}.webp`);
}
for (const project of projects)
  for (const width of [640, 1200]) {
    const image = sharp(`source-assets/projects/${project.image}.png`).resize({
      width,
      height: Math.round((width * 850) / 1200),
      fit: "cover",
      position: "top",
    });
    await image
      .clone()
      .avif({ quality: 60 })
      .toFile(`public/assets/projects/${project.image}-${width}.avif`);
    await image
      .clone()
      .webp({ quality: 83 })
      .toFile(`public/assets/projects/${project.image}-${width}.webp`);
  }
await sharp("public/assets/brand/vital-logo-original.webp")
  .resize(64, 64, { fit: "contain", background: "white" })
  .png()
  .toFile("public/favicon.png");
await sharp("public/assets/brand/vital-logo-original.webp")
  .resize(180, 180, { fit: "contain", background: "white" })
  .png()
  .toFile("public/apple-touch-icon.png");
// Own brand sharing image; no fabricated client claims or performance figures.
const typography = Buffer.from(
  `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#101c4c" fill-opacity=".3"/><text x="62" y="155" font-family="sans-serif" font-size="19" letter-spacing="4" fill="#f0f3fa">VITAL DESIGN SOURCE</text><g fill="#f0f3fa" font-family="sans-serif" font-size="74" font-weight="600" letter-spacing="-3"><text x="58" y="285">Design with</text><text x="58" y="372" fill="#f07a8c">a pulse.</text></g><text x="62" y="550" font-family="sans-serif" font-size="16" fill="#b5c4e3">Web. Brand. Intelligent systems.</text></svg>`,
);
const crest = await sharp("public/assets/brand/vital-logo-light.png")
  .resize({ width: 74 })
  .toBuffer();
await sharp("source-assets/ribbon-master.png")
  .resize(1200, 630, { fit: "cover" })
  .composite([{ input: typography }, { input: crest, left: 1045, top: 55 }])
  .jpeg({ quality: 88 })
  .toFile("public/assets/og-image.jpg");
console.info(
  "Generated responsive hero and portfolio assets, crest icons, and social preview.",
);
