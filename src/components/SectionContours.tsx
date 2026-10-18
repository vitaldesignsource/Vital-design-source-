import { useId } from "react";

const contours = [
  "M-160 344C105 594 278 488 292 322S164 98 368 79 640 435 868 261 1056 21 1270 117",
  "M-145 366C112 599 298 482 311 318S183 113 373 96 647 448 875 278 1075 39 1282 137",
  "M-130 388C120 604 318 476 330 314S202 128 378 113 654 461 882 295 1094 57 1294 157",
  "M-115 410C128 609 338 470 349 310S221 143 383 130 661 474 889 312 1113 75 1306 177",
  "M-100 432C136 614 358 464 368 306S240 158 388 147 668 487 896 329 1132 93 1318 197",
  "M-85 454C144 619 378 458 387 302S259 173 393 164 675 500 903 346 1151 111 1330 217",
] as const;

/** Quiet, local vector artwork; the foreground and its focus rings stay clear. */
export function SectionContours({
  variant,
}: {
  variant: "work" | "services" | "contact";
}) {
  const gradientId = `contour-${useId().replaceAll(":", "")}`;
  return (
    <div
      className={`section-contours section-contours-${variant}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 620" fill="none" focusable="false">
        <defs>
          <linearGradient
            id={gradientId}
            x1="70"
            y1="510"
            x2="930"
            y2="90"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" stopOpacity="0" />
            <stop offset=".35" stopColor="currentColor" stopOpacity=".65" />
            <stop offset=".7" stopColor="currentColor" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke={`url(#${gradientId})`} strokeWidth=".8">
          {contours.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g stroke="currentColor" strokeWidth=".8" opacity=".5">
          <path d="M747 180h14m-7-7v14M907 350h10m-5-5v10" />
          <circle cx="642" cy="320" r="3" />
          <circle cx="642" cy="320" r="9" opacity=".45" />
        </g>
      </svg>
    </div>
  );
}
