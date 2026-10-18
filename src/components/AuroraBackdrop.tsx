import { useEffect, useId, useRef, useState } from "react";

const contours = [
  "M660 595C655 390 835 142 1086 88C1348 32 1520 228 1448 460C1376 692 1099 836 860 773C751 744 685 678 660 595Z",
  "M687 582C688 389 860 165 1092 115C1333 63 1492 242 1424 455C1358 667 1103 800 882 746C779 720 711 658 687 582Z",
  "M714 568C721 389 883 190 1098 142C1318 94 1464 254 1400 450C1340 644 1108 764 904 719C808 697 737 638 714 568Z",
  "M742 555C755 390 906 214 1104 169C1302 125 1436 267 1375 445C1322 620 1113 729 925 692C836 675 764 618 742 555Z",
  "M769 541C788 391 930 238 1110 196C1287 157 1408 280 1351 440C1304 596 1118 693 947 665C865 651 790 597 769 541Z",
  "M796 528C821 392 953 262 1116 223C1272 188 1380 293 1327 435C1286 573 1123 657 969 638C893 628 816 577 796 528Z",
  "M620 702C770 780 1027 735 1242 574C1457 413 1530 196 1391 100C1285 27 1086 69 944 171",
  "M645 728C799 806 1051 758 1268 594C1485 430 1561 210 1416 111C1305 35 1108 77 968 178",
  "M673 753C829 831 1076 780 1294 614C1513 448 1591 224 1442 123C1326 44 1130 85 992 185",
  "M700 778C859 856 1101 803 1321 634C1541 466 1622 238 1467 135C1346 52 1152 93 1016 192",
] as const;

interface DataConnection extends EventTarget {
  saveData?: boolean;
}

/** Inline light and contours; motion is an optional, visibility-bound layer. */
export function AuroraBackdrop({ active }: { active: boolean }) {
  const element = useRef<HTMLDivElement>(null);
  const [canMove, setCanMove] = useState(false);
  const id = `aurora-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const target = element.current;
    // Older browsers retain the complete static composition without observers.
    if (!target || typeof IntersectionObserver === "undefined") return;
    let visible = false;
    const connection = (
      navigator as Navigator & { connection?: DataConnection }
    ).connection;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setCanMove(
        visible &&
          !document.hidden &&
          document.visibilityState !== "hidden" &&
          !connection?.saveData &&
          !preference.matches,
      );
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(target);
    document.addEventListener("visibilitychange", update);
    preference.addEventListener("change", update);
    connection?.addEventListener?.("change", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      preference.removeEventListener("change", update);
      connection?.removeEventListener?.("change", update);
    };
  }, []);

  return (
    <div
      ref={element}
      className="aurora-backdrop"
      data-motion={active && canMove ? "running" : "paused"}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 860"
        preserveAspectRatio="none"
        focusable="false"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${id}-fade`} x1="0" x2="1">
            <stop offset="0.32" stopColor="#000" />
            <stop offset="0.48" stopColor="#000" />
            <stop offset="0.65" stopColor="#b8b8b8" />
            <stop offset="0.8" stopColor="#fff" />
          </linearGradient>
          <mask id={`${id}-right`} maskUnits="userSpaceOnUse">
            <rect width="1440" height="860" fill={`url(#${id}-fade)`} />
          </mask>
          <radialGradient id={`${id}-quiet`}>
            <stop offset="0.2" stopColor="#000" />
            <stop offset="0.58" stopColor="#333" />
            <stop offset="1" stopColor="#fff" />
          </radialGradient>
          <mask id={`${id}-space`} maskUnits="userSpaceOnUse">
            <rect width="1440" height="860" fill="#fff" />
            <ellipse
              cx="1080"
              cy="410"
              rx="245"
              ry="270"
              fill={`url(#${id}-quiet)`}
            />
          </mask>
          <radialGradient id={`${id}-field`}>
            <stop stopColor="var(--aurora, #78cfba)" stopOpacity="0.22" />
            <stop
              offset="0.48"
              stopColor="var(--aurora-blue, #688fba)"
              stopOpacity="0.1"
            />
            <stop
              offset="1"
              stopColor="var(--aurora, #78cfba)"
              stopOpacity="0"
            />
          </radialGradient>
          <linearGradient id={`${id}-ribbon`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--aurora-blue, #688fba)" stopOpacity="0" />
            <stop
              offset="0.36"
              stopColor="var(--aurora, #78cfba)"
              stopOpacity="0.22"
            />
            <stop
              offset="0.62"
              stopColor="var(--aurora-soft, #b7e4cf)"
              stopOpacity="0.42"
            />
            <stop
              offset="1"
              stopColor="var(--aurora-blue, #688fba)"
              stopOpacity="0.02"
            />
          </linearGradient>
          <linearGradient id={`${id}-contour`} x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="var(--aurora, #78cfba)" stopOpacity="0.05" />
            <stop
              offset="0.42"
              stopColor="var(--aurora, #78cfba)"
              stopOpacity="0.5"
            />
            <stop
              offset="0.7"
              stopColor="var(--aurora-soft, #b7e4cf)"
              stopOpacity="0.75"
            />
            <stop
              offset="1"
              stopColor="var(--aurora-blue, #688fba)"
              stopOpacity="0.08"
            />
          </linearGradient>
          <linearGradient id={`${id}-light`} x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="var(--aurora, #78cfba)" stopOpacity="0" />
            <stop
              offset="0.4"
              stopColor="var(--aurora-soft, #b7e4cf)"
              stopOpacity="0.85"
            />
            <stop
              offset="0.7"
              stopColor="var(--aurora, #78cfba)"
              stopOpacity="0.55"
            />
            <stop
              offset="1"
              stopColor="var(--aurora-blue, #688fba)"
              stopOpacity="0"
            />
          </linearGradient>
          <radialGradient id={`${id}-node`}>
            <stop stopColor="var(--aurora-soft, #b7e4cf)" stopOpacity="0.48" />
            <stop
              offset="1"
              stopColor="var(--aurora, #78cfba)"
              stopOpacity="0"
            />
          </radialGradient>
        </defs>
        <g mask={`url(#${id}-right)`}>
          <ellipse
            className="aurora-field"
            cx="1160"
            cy="410"
            rx="590"
            ry="490"
            fill={`url(#${id}-field)`}
          />
          <g mask={`url(#${id}-space)`}>
            <g className="aurora-ribbons" fill={`url(#${id}-ribbon)`}>
              <path d="M820 113C1030-36 1363 8 1492 251C1646 540 1374 805 1101 835C1330 771 1507 530 1396 294C1298 83 1042 38 820 113Z" />
              <path d="M620 701C880 849 1247 650 1408 378C1313 655 934 908 620 701Z" />
            </g>
            <g className="aurora-contours" fill="none">
              {contours.map((path) => (
                <path
                  className="aurora-contour"
                  key={path}
                  d={path}
                  stroke={`url(#${id}-contour)`}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {[contours[1], contours[4], contours[7]].map((path) => (
                <path
                  className="aurora-highlight"
                  key={path}
                  d={path}
                  pathLength="1000"
                  stroke={`url(#${id}-light)`}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
            <g className="aurora-nodes">
              {[
                [1285, 195],
                [1375, 550],
                [815, 700],
              ].map(([cx, cy]) => (
                <g className="aurora-node" key={`${cx}-${cy}`}>
                  <circle cx={cx} cy={cy} r="15" fill={`url(#${id}-node)`} />
                  <circle className="aurora-node-core" cx={cx} cy={cy} r="2" />
                </g>
              ))}
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
