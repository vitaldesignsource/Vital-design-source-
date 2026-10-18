import { useId } from "react";
import geometry from "../lib/crest-geometry.json";

/** A refined vector expression of the supplied heraldic crest. */
export function BrandCrest() {
  const id = `vital-crest-${useId().replaceAll(":", "")}`;
  const shield = geometry.paths[geometry.shieldIndex];
  return (
    <svg
      className="brand-crest"
      viewBox={geometry.viewBox}
      width="78"
      height="68"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <g id={`${id}-shape`}>
          {geometry.paths.map((path, index) => (
            <path key={index} d={path.d} transform={path.transform} />
          ))}
        </g>
        <linearGradient id={`${id}-silver`} x1="0" y1="0" x2="0.85" y2="1">
          <stop stopColor="#f4f3eb" />
          <stop offset="0.32" stopColor="#d5dbd2" />
          <stop offset="0.5" stopColor="#87968b" />
          <stop offset="0.7" stopColor="#eef1e9" />
          <stop offset="1" stopColor="#b4c1b5" />
        </linearGradient>
        <linearGradient id={`${id}-light`}>
          <stop stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <use href={`#${id}-shape`} />
        </clipPath>
      </defs>
      <use href={`#${id}-shape`} fill={`url(#${id}-silver)`} />
      <path
        className="crest-etch"
        d={shield.d}
        transform={shield.transform}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="9"
        pathLength="1"
        strokeDasharray="1"
      />
      <g clipPath={`url(#${id}-clip)`}>
        <rect
          className="crest-glint"
          x="-320"
          y="-220"
          width="320"
          height="1600"
          fill={`url(#${id}-light)`}
        />
      </g>
    </svg>
  );
}
