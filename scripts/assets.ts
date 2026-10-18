import sharp from "sharp";
import "./brand-assets";
import { mkdir } from "node:fs/promises";
import { projects } from "../src/lib/content";

await mkdir("public/assets/projects", { recursive: true });
for (const width of [640, 1280]) {
  const image = sharp("source-assets/neural-master.png").resize({
    width,
    height: width,
    fit: "cover",
  });
  await image
    .clone()
    .avif({ quality: 60 })
    .toFile(`public/assets/neural-${width}.avif`);
  await image
    .clone()
    .webp({ quality: 83 })
    .toFile(`public/assets/neural-${width}.webp`);
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
  `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#060d0c"/><text x="140" y="94" font-family="sans-serif" font-size="17" letter-spacing="2" fill="#edf8f3">VITAL DESIGN SOURCE</text><g fill="#edf8f3" font-family="sans-serif" font-size="78" font-weight="400" letter-spacing="-4"><text x="52" y="288">Ideas beyond</text><text x="52" y="378" fill="#b5ffdc">ordinary.</text></g><text x="57" y="548" font-family="sans-serif" font-size="17" fill="#afbfb7">Design. Intelligence. Motion.</text></svg>`,
);
const crest = await sharp("public/assets/brand/vital-logo-light.png")
  .resize({ width: 74 })
  .toBuffer();
const sculpture = await sharp("source-assets/neural-master.png")
  .resize(600, 600, { fit: "cover" })
  .toBuffer();
await sharp({
  create: { width: 1200, height: 630, channels: 3, background: "#060d0c" },
})
  .composite([
    { input: typography },
    { input: sculpture, left: 580, top: 15 },
    { input: crest, left: 55, top: 50 },
  ])
  .jpeg({ quality: 88 })
  .toFile("public/assets/og-neural.jpg");
console.info(
  "Generated responsive hero and portfolio assets, crest icons, and social preview.",
);
