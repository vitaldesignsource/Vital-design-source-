import sharp from "sharp";
import "./brand-assets";
import { mkdir } from "node:fs/promises";
import { projects } from "../src/lib/content";
import socialLettering from "../source-assets/brand/social-lettering.json";

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
const lettering = socialLettering
  .map(
    ({ d, fill, transform }) =>
      `<path d="${d}" fill="${fill}" transform="${transform}"/>`,
  )
  .join("");
const typography = Buffer.from(
  `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="glow"><stop stop-color="#2e5a45" stop-opacity=".55"/><stop offset="1" stop-color="#090d0c" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="#090d0c"/><ellipse cx="960" cy="315" rx="460" ry="390" fill="url(#glow)"/>${lettering}</svg>`,
);
const crest = await sharp("public/assets/brand/vital-logo-light.png")
  .resize({ width: 74 })
  .toBuffer();
const sculpture = await sharp("public/assets/brand/vital-crest-silver.svg")
  .resize({ width: 520 })
  .toBuffer();
await sharp({
  create: { width: 1200, height: 630, channels: 3, background: "#090d0c" },
})
  .composite([
    { input: typography },
    { input: sculpture, left: 645, top: 110 },
    { input: crest, left: 55, top: 50 },
  ])
  .jpeg({ quality: 88 })
  .toFile("public/assets/og-vital.jpg");
console.info(
  "Generated responsive hero and portfolio assets, crest icons, and social preview.",
);
