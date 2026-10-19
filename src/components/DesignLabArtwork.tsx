import { useId } from "react";
import type { DesignDirection } from "../lib/design-directions";

function LiquidChrome() {
  return (
    <div className="lab-composition lab-chrome" data-composition="liquid-metal">
      <div className="lab-grid" />
      <div className="lab-orbit lab-orbit-one" />
      <div className="lab-orbit lab-orbit-two" />
      <picture className="lab-artwork">
        <source type="image/avif" srcSet="/assets/neural-1280.avif" />
        <img
          src="/assets/neural-1280.webp"
          alt=""
          width="1280"
          height="1280"
          loading="lazy"
          decoding="async"
        />
      </picture>
      <span className="lab-chrome-rule lab-chrome-rule-one" />
      <span className="lab-chrome-rule lab-chrome-rule-two" />
      <div className="lab-glass lab-glass-one" />
      <span className="lab-specimen-label eyebrow">Reflective matter / 01</span>
    </div>
  );
}

/** A local vector study: six translucent facets around an open aperture. */
function Prismatic() {
  const id = useId().replaceAll(":", "");
  const fill = (name: string) => `url(#${id}-${name})`;

  return (
    <div
      className="lab-composition lab-prismatic"
      data-composition="glass-facets"
    >
      <span className="lab-prism-halo" />
      <svg
        className="lab-prism-art"
        viewBox="0 0 800 800"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={`${id}-top`}
            x1="315"
            y1="115"
            x2="560"
            y2="350"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#eff2ff" stopOpacity=".95" />
            <stop offset=".34" stopColor="#c7a1ec" stopOpacity=".56" />
            <stop offset=".76" stopColor="#7eb7d7" stopOpacity=".2" />
            <stop offset="1" stopColor="#f2e4ff" stopOpacity=".73" />
          </linearGradient>
          <linearGradient
            id={`${id}-right`}
            x1="640"
            y1="250"
            x2="500"
            y2="520"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#d9eeff" stopOpacity=".82" />
            <stop offset=".3" stopColor="#85a2d0" stopOpacity=".25" />
            <stop offset=".65" stopColor="#d7b9f5" stopOpacity=".58" />
            <stop offset="1" stopColor="#a3dfdc" stopOpacity=".88" />
          </linearGradient>
          <linearGradient
            id={`${id}-lower`}
            x1="575"
            y1="485"
            x2="380"
            y2="650"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#9ec7da" stopOpacity=".24" />
            <stop offset=".44" stopColor="#d8e8ed" stopOpacity=".92" />
            <stop offset=".67" stopColor="#e0bcf4" stopOpacity=".52" />
            <stop offset="1" stopColor="#a0c7da" stopOpacity=".14" />
          </linearGradient>
          <linearGradient
            id={`${id}-base`}
            x1="400"
            y1="650"
            x2="235"
            y2="465"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f1d7e9" stopOpacity=".82" />
            <stop offset=".38" stopColor="#c4b0dc" stopOpacity=".32" />
            <stop offset="1" stopColor="#93d9ce" stopOpacity=".65" />
          </linearGradient>
          <linearGradient
            id={`${id}-left`}
            x1="160"
            y1="240"
            x2="305"
            y2="490"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#c8ddfb" stopOpacity=".63" />
            <stop offset=".42" stopColor="#9a83ce" stopOpacity=".16" />
            <stop offset=".75" stopColor="#e8d3fb" stopOpacity=".72" />
            <stop offset="1" stopColor="#b2e2de" stopOpacity=".35" />
          </linearGradient>
          <linearGradient
            id={`${id}-upper`}
            x1="170"
            y1="270"
            x2="430"
            y2="180"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#a2d9cf" stopOpacity=".23" />
            <stop offset=".46" stopColor="#e9e6ff" stopOpacity=".86" />
            <stop offset="1" stopColor="#bf9acb" stopOpacity=".4" />
          </linearGradient>
          <linearGradient
            id={`${id}-edge`}
            x1="160"
            y1="120"
            x2="640"
            y2="660"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#d6d1ff" stopOpacity=".28" />
            <stop offset=".35" stopColor="#f7fbff" stopOpacity=".94" />
            <stop offset=".67" stopColor="#b6e5df" stopOpacity=".25" />
            <stop offset="1" stopColor="#e8c8f5" stopOpacity=".84" />
          </linearGradient>
          <linearGradient
            id={`${id}-depth`}
            x1="265"
            y1="240"
            x2="650"
            y2="600"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#8b88b5" stopOpacity=".1" />
            <stop offset=".5" stopColor="#9bb9d6" stopOpacity=".5" />
            <stop offset="1" stopColor="#9979b6" stopOpacity=".22" />
          </linearGradient>
          <radialGradient id={`${id}-shadow`}>
            <stop stopColor="#a990cf" stopOpacity=".3" />
            <stop offset="1" stopColor="#a990cf" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="400" cy="672" rx="240" ry="51" fill={fill("shadow")} />
        <g
          className="lab-prism-guides"
          stroke="#cfc9e4"
          strokeOpacity=".18"
          strokeWidth="1"
        >
          <ellipse
            cx="400"
            cy="385"
            rx="335"
            ry="153"
            transform="rotate(-27 400 385)"
          />
          <path d="M95 387H705M400 80V695" strokeDasharray="3 10" />
          <path d="M91 235h16m-8-8v16M690 544h16m-8-8v16" />
        </g>
        <g className="lab-prism-sculpture">
          <g transform="rotate(-17 400 390)">
            <path
              d="m400 120 240 140 23 25-240-140Zm240 140v260l23 25V285Zm0 260L400 660l23 25 240-140Z"
              fill={fill("depth")}
              stroke={fill("edge")}
              strokeWidth="1.2"
            />
            <path
              d="m400 240 130 75v150l-23-25V340l-107-62-107 62v100l-23 25V315Z"
              fill={fill("depth")}
              stroke={fill("edge")}
              strokeWidth="1.2"
            />
            <path d="m400 120 240 140-110 55-130-75Z" fill={fill("top")} />
            <path d="M640 260v260l-110-55V315Z" fill={fill("right")} />
            <path d="M640 520 400 660V540l130-75Z" fill={fill("lower")} />
            <path d="M400 660 160 520l110-55 130 75Z" fill={fill("base")} />
            <path d="M160 520V260l110 55v150Z" fill={fill("left")} />
            <path d="m160 260 240-140v120l-130 75Z" fill={fill("upper")} />
            <path
              d="m400 120 240 140v260L400 660 160 520V260Zm0 120-130 75v150l130 75 130-75V315Z"
              stroke={fill("edge")}
              strokeWidth="2"
            />
            <path
              d="M400 120v120m240 20-110 55m110 205-110-55M400 660V540M160 520l110-55M160 260l110 55"
              stroke={fill("edge")}
              strokeWidth="1.2"
            />
            <path
              d="m410 135 216 130M175 274v234M414 647l212-125"
              stroke="#f4f3ff"
              strokeOpacity=".68"
              strokeWidth="1"
            />
          </g>
        </g>
        <g stroke="#d5e9e3" strokeWidth="1.5" strokeLinecap="round">
          <path d="M624 171v18m-9-9h18" />
          <path d="M174 552v10m-5-5h10" strokeOpacity=".5" />
        </g>
      </svg>
      <span className="lab-specimen-label eyebrow">
        Light, through form / 02
      </span>
      <span className="lab-prism-spectrum" />
    </div>
  );
}

function Editorial() {
  return (
    <div
      className="lab-composition lab-editorial"
      data-composition="type-specimen"
    >
      <div className="lab-editorial-grid" />
      <span className="lab-editorial-edition eyebrow">
        Visual journal / No. 03
      </span>
      <div className="lab-editorial-specimen">
        <span className="lab-editorial-glyph">V</span>
        <span className="lab-editorial-disc">
          <span />
          <span />
          <span />
        </span>
        <span className="lab-editorial-cross lab-editorial-cross-one" />
        <span className="lab-editorial-cross lab-editorial-cross-two" />
      </div>
      <span className="lab-editorial-note eyebrow">
        The space
        <br />
        between ideas.
      </span>
      <div className="lab-editorial-palette">
        <span className="lab-editorial-chip lab-editorial-chip-ink" />
        <span className="lab-editorial-chip lab-editorial-chip-jade" />
        <span className="lab-editorial-chip lab-editorial-chip-paper" />
        <span className="eyebrow">Ink / Jade / Ivory</span>
      </div>
    </div>
  );
}

export function DesignLabArtwork({
  direction,
}: {
  direction: DesignDirection["id"];
}) {
  return (
    <div className="lab-art-direction" aria-hidden="true">
      {direction === "chrome" ? (
        <LiquidChrome />
      ) : direction === "prismatic" ? (
        <Prismatic />
      ) : (
        <Editorial />
      )}
    </div>
  );
}
