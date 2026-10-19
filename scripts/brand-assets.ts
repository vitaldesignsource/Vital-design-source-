import { mkdir, writeFile } from "node:fs/promises";
import geometry from "../src/lib/crest-geometry.json";
import wordmark from "../source-assets/brand/wordmark-paths.json";
import { getCrestFinish } from "../src/lib/crest-finish";

const folder = "public/assets/brand";
await mkdir(folder, { recursive: true });
const paths = geometry.paths
  .map((path) => `<path d="${path.d}" transform="${path.transform}"/>`)
  .join("");
const shield = geometry.paths[geometry.shieldIndex];
const silver = `<linearGradient id="silver" x1="0" y1="0" x2="0.85" y2="1"><stop stop-color="#f4f3eb"/><stop offset="0.32" stop-color="#d5dbd2"/><stop offset="0.5" stop-color="#87968b"/><stop offset="0.7" stop-color="#eef1e9"/><stop offset="1" stop-color="#b4c1b5"/></linearGradient>`;
const light = `<linearGradient id="light"><stop stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
const open = (viewBox: string, title: string, width: number, height: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" role="img" aria-labelledby="title"><title id="title">${title}</title>`;
const animation = `<path d="${shield.d}" transform="${shield.transform}" fill="none" stroke="#b8d9c3" stroke-width="9" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0"><animate attributeName="stroke-dashoffset" from="1" to="0" begin="0.12s" dur="1.1s" fill="freeze"/><animate attributeName="opacity" values="0;0.85;0.85;0" keyTimes="0;0.12;0.78;1" begin="0.12s" dur="1.45s" fill="freeze"/></path><g clip-path="url(#clip)"><g transform="skewX(-18)"><rect x="-320" y="-220" width="320" height="1600" fill="url(#light)" transform="translate(-1300 0)"><animateTransform attributeName="transform" type="translate" from="-1300 0" to="1800 0" begin="0.22s" dur="1.35s" fill="freeze"/></rect></g></g>`;
for (const [filename, fill] of [
  ["vital-crest.svg", "#17271e"],
  ["vital-crest-silver.svg", "url(#silver)"],
] as const) {
  await writeFile(
    `${folder}/${filename}`,
    `${open(geometry.viewBox, "Vital Design Source refined heraldic crest", 512, 401)}<defs>${silver}</defs><g fill="${fill}">${paths}</g></svg>\n`,
  );
}
await writeFile(
  `${folder}/vital-crest-animated.svg`,
  `${open(geometry.viewBox, "Vital Design Source animated heraldic crest", 512, 401)}<desc>A brief shield reveal and silver highlight settle into a static crest.</desc><defs>${silver}${light}<g id="shape">${paths}</g><clipPath id="clip"><use href="#shape"/></clipPath></defs><use href="#shape" fill="url(#silver)"/>${animation}</svg>\n`,
);
const lettering = wordmark
  .map((path) => `<path d="${path.d}" transform="${path.transform}"/>`)
  .join("");
await writeFile(
  `${folder}/vital-lockup.svg`,
  `${open("0 0 680 280", "Vital Design Source", 680, 280)}<defs>${silver}</defs><g fill="url(#silver)"><g transform="translate(20 35) scale(0.183)">${paths}</g>${lettering}</g></svg>\n`,
);
console.info(
  "Generated true vector crest, silver variant, finite animated SVG, and outlined wordmark.",
);

// A separate hero treatment leaves the official exports above unchanged.
const auroraEdge = `<linearGradient id="aurora-edge" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#b7e4cf" stop-opacity="0.04"/><stop offset="0.38" stop-color="#78cfba" stop-opacity="0.24"/><stop offset="0.65" stop-color="#e5f1e8" stop-opacity="0.3"/><stop offset="0.86" stop-color="#78cfba" stop-opacity="0.12"/><stop offset="1" stop-color="#b7e4cf" stop-opacity="0"/></linearGradient>`;
const auroraPaths = geometry.paths
  .map((path, index) => {
    const finish = getCrestFinish(index);
    return `<path d="${path.d}" transform="${path.transform}" fill="url(#silver)" fill-opacity="${finish.faceOpacity}" stroke="url(#aurora-edge)" stroke-width="1.6" stroke-opacity="${finish.edgeOpacity}" stroke-linejoin="round"/>`;
  })
  .join("");
await writeFile(
  `${folder}/vital-crest-aurora.svg`,
  `${open(geometry.viewBox, "Vital Design Source silver and celadon heraldic crest", 512, 401)}<defs>${silver}${auroraEdge}</defs>${auroraPaths}</svg>\n`,
);
console.info("Generated the separate silver and celadon hero crest.");
