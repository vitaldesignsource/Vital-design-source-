/** Optional asset preparation only. Normal builds never invoke FFmpeg. */
import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { brandFilm } from "../src/lib/brand-film";

const source = "source-assets/brand/vital-brand-film-higgsfield-original.mp4";
await mkdir("public/assets/brand", { recursive: true });
execFileSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    source,
    "-map_metadata",
    "-1",
    "-an",
    "-t",
    String(brandFilm.duration),
    "-r",
    "24",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-level",
    "4.1",
    "-preset",
    "slow",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-colorspace",
    "bt709",
    "-movflags",
    "+faststart",
    `public${brandFilm.source}`,
  ],
  { stdio: "inherit" },
);
execFileSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-ss",
    "5.5",
    "-i",
    source,
    "-frames:v",
    "1",
    "-c:v",
    "libwebp",
    "-quality",
    "88",
    `public${brandFilm.poster}`,
  ],
  { stdio: "inherit" },
);
console.info("Prepared the local H.264 brand film and full-resolution poster.");
