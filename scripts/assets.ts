import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { projects } from "../src/lib/content";

await mkdir("public/assets/projects", { recursive: true });
for (const width of [640, 1120]) {
  const image = sharp("source-assets/presence-master.png").resize({
    width,
    height: Math.round(width * 1.25),
    fit: "cover",
  });
  await image
    .clone()
    .avif({ quality: 60 })
    .toFile(`public/assets/presence-${width}.avif`);
  await image
    .clone()
    .webp({ quality: 83 })
    .toFile(`public/assets/presence-${width}.webp`);
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
  `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#171816"/><text x="62" y="105" font-family="sans-serif" font-size="17" letter-spacing="3" fill="#f3efe5">VITAL DESIGN SOURCE</text><g fill="#f3efe5" font-family="sans-serif" font-size="94" font-weight="500" letter-spacing="-5"><text x="57" y="260">Make your</text><text x="57" y="353">presence</text><text x="57" y="448" fill="#f47750">felt.</text></g><text x="62" y="562" font-family="sans-serif" font-size="16" fill="#b8b8aa">Distinctive design. Connected thinking.</text></svg>`,
);
const crest = await sharp("public/assets/brand/vital-logo-light.png")
  .resize({ width: 74 })
  .toBuffer();
const sculpture = await sharp("source-assets/presence-master.png")
  .resize(420, 550, { fit: "cover" })
  .toBuffer();
await sharp({
  create: { width: 1200, height: 630, channels: 3, background: "#171816" },
})
  .composite([
    { input: typography },
    { input: sculpture, left: 720, top: 40 },
    { input: crest, left: 615, top: 60 },
  ])
  .jpeg({ quality: 88 })
  .toFile("public/assets/og-editorial.jpg");
console.info(
  "Generated responsive hero and portfolio assets, crest icons, and social preview.",
);
