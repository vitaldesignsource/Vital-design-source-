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
    let visible = false;
    let loading = false;
    // A static, fully resolved identity is preferable on a data-saving connection.
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData || !("IntersectionObserver" in window)) return;
    const enhance = async () => {
      if (cancelled || loading || scene.current || !visible || document.hidden)
        return;
      loading = true;
      try {
        const { createCrestScene } = await import("../lib/crest-scene");
        const bounds = element.getBoundingClientRect();
        // An anchor or scroll may move the crest during the module request.
        if (
          cancelled ||
          !visible ||
          document.hidden ||
          bounds.bottom <= 0 ||
          bounds.top >= innerHeight ||
          bounds.right <= 0 ||
          bounds.left >= innerWidth
        )
          return;
        scene.current = createCrestScene(element, motion.current);
      } catch {
        // Rendering is progressive enhancement; the SVG needs no recovery UI.
      } finally {
        loading = false;
      }
    };
    // Keep optional environment/geometry setup out of offscreen page visits.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) void enhance();
      },
      { threshold: 0.01 },
    );
    observer.observe(element);
    const onVisibility = () => {
      if (!document.hidden) void enhance();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
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
