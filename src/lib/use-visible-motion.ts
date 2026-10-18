import { useEffect, useRef, useState } from "react";

/** Keep local motion intent while suspending an offscreen or background scene. */
export function useVisibleMotion<T extends Element>(enabled: boolean) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const updateVisibility = () => setForeground(!document.hidden);
    const frame = requestAnimationFrame(() => {
      updateVisibility();
      if (!("IntersectionObserver" in window)) setVisible(true);
    });
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.01 },
          )
        : null;
    observer?.observe(element);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);
  return { ref, running: enabled && visible && foreground };
}
