import { useEffect, useId, useRef, useState } from "react";

type MotionState = "ready" | "running" | "paused" | "complete" | "static";
type DataConnection = EventTarget & { saveData?: boolean };

const contours = [
  "M350 320C610 320 678 37 934 37S1190 263 1530 109",
  "M322 309C598 309 700 56 946 56S1198 244 1525 126",
  "M292 297C587 297 720 75 957 75S1206 224 1520 143",
  "M260 285C576 285 739 94 969 94S1214 204 1515 160",
  "M226 273C565 273 758 113 980 113S1222 184 1510 177",
  "M190 261C554 261 777 132 992 132S1230 164 1505 194",
  "M152 249C543 249 796 151 1003 151S1238 144 1500 211",
] as const;

/** A static-first decorative interlude with one finite, optional light pass. */
export function SignalBanner() {
  const banner = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const finished = useRef(false);
  const [motion, setMotion] = useState<MotionState>("ready");
  const id = `vital-signal-${useId().replaceAll(":", "")}`;

  useEffect(() => {
    const element = banner.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: DataConnection }
    ).connection;
    let visible = false;
    const observerSupported = typeof IntersectionObserver !== "undefined";

    const updateMotion = () => {
      if (finished.current) return;
      if (preference.matches || connection?.saveData || !observerSupported) {
        finished.current = true;
        setMotion("static");
        return;
      }
      const canRun = visible && !document.hidden;
      if (!started.current) {
        if (!canRun) return;
        started.current = true;
      }
      setMotion(canRun ? "running" : "paused");
    };

    const observer = observerSupported
      ? new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            updateMotion();
          },
          { threshold: 0 },
        )
      : null;
    observer?.observe(element);
    preference.addEventListener("change", updateMotion);
    connection?.addEventListener?.("change", updateMotion);
    document.addEventListener("visibilitychange", updateMotion);
    const initialFrame = requestAnimationFrame(updateMotion);

    return () => {
      cancelAnimationFrame(initialFrame);
      observer?.disconnect();
      preference.removeEventListener("change", updateMotion);
      connection?.removeEventListener?.("change", updateMotion);
      document.removeEventListener("visibilitychange", updateMotion);
    };
  }, []);

  return (
    <div
      ref={banner}
      className="signal-banner"
      data-motion={motion}
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.animationName !== "signal-banner-light-pass") return;
        finished.current = true;
        setMotion("complete");
      }}
    >
      <svg
        className="signal-banner-art"
        viewBox="0 0 1440 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`${id}-ribbon`} x1="0" y1="1" x2="1" y2="0">
            <stop className="signal-banner-gradient-edge" stopOpacity="0" />
            <stop
              className="signal-banner-gradient-jade"
              offset="0.45"
              stopOpacity="0.3"
            />
            <stop
              className="signal-banner-gradient-jade"
              offset="0.8"
              stopOpacity="0.75"
            />
            <stop className="signal-banner-gradient-edge" offset="1" />
          </linearGradient>
          <linearGradient id={`${id}-light`}>
            <stop className="signal-banner-gradient-light" stopOpacity="0" />
            <stop
              className="signal-banner-gradient-light"
              offset="0.5"
              stopOpacity="0.95"
            />
            <stop
              className="signal-banner-gradient-light"
              offset="1"
              stopOpacity="0"
            />
          </linearGradient>
          <radialGradient id={`${id}-orb`} cx="0.3" cy="0.25" r="0.8">
            <stop className="signal-banner-gradient-light" />
            <stop className="signal-banner-gradient-edge" offset="0.6" />
            <stop className="signal-banner-gradient-jade" offset="1" />
          </radialGradient>
          <clipPath id={`${id}-orb-clip`}>
            <circle cx="1160" cy="148" r="58" />
          </clipPath>
        </defs>

        <g className="signal-banner-contours" fill="none">
          {contours.map((path) => (
            <path key={path} d={path} stroke={`url(#${id}-ribbon)`} />
          ))}
        </g>
        <g
          className="signal-banner-traces"
          fill="none"
          stroke={`url(#${id}-ribbon)`}
        >
          {contours.map((path) => (
            <path key={path} d={path} pathLength="1" />
          ))}
        </g>

        <g className="signal-banner-orbit" fill="none">
          <ellipse cx="1160" cy="148" rx="100" ry="38" />
          <ellipse
            cx="1160"
            cy="148"
            rx="100"
            ry="38"
            transform="rotate(-42 1160 148)"
          />
        </g>
        <circle
          className="signal-banner-orb"
          cx="1160"
          cy="148"
          r="58"
          fill={`url(#${id}-orb)`}
        />
        <path
          className="signal-banner-diamond"
          d="M1160 124 1179 148 1160 172 1141 148Z"
        />
        <g clipPath={`url(#${id}-orb-clip)`}>
          <rect
            className="signal-banner-sweep"
            x="1064"
            y="64"
            width="48"
            height="168"
            fill={`url(#${id}-light)`}
            transform="rotate(24 1160 148)"
          />
        </g>
      </svg>

      <div className="signal-banner-inner page-width">
        <p className="signal-banner-copy">
          <span>Human imagination.</span>
          <em>Extraordinary possibilities.</em>
        </p>
      </div>
    </div>
  );
}
