import { useEffect, useRef } from "react";
import type { CrestScene } from "../lib/crest-scene";

/** The vector stays visible until the optional WebGL enhancement has painted. */
export function CrestSculpture({ active }: { active: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const scene = useRef<CrestScene | null>(null);
  const motion = useRef(active);

  useEffect(() => {
    motion.current = active;
    scene.current?.setActive(active);
  }, [active]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let cancelled = false;
    // A static, fully resolved identity is preferable on a data-saving connection.
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;
    void import("../lib/crest-scene")
      .then(({ createCrestScene }) => {
        if (cancelled) return;
        scene.current = createCrestScene(element, motion.current);
      })
      .catch(() => {
        // Rendering is progressive enhancement; the SVG needs no recovery UI.
      });
    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  return (
    <div
      className="hero-art crest-sculpture"
      ref={container}
      data-renderer="vector"
      data-finish="silver-translucent"
      data-sheen="static"
      data-sheen-progress="0"
    >
      <img
        className="crest-sculpture-fallback"
        src="/assets/brand/vital-crest-aurora.svg"
        alt=""
        width="1417"
        height="1110"
        fetchPriority="high"
      />
    </div>
  );
}
