import { useEffect, useState } from "react";
import { Pause, Play, Waves } from "lucide-react";

interface DataConnection extends EventTarget {
  saveData?: boolean;
}

export interface BackgroundMotionState {
  allowed: boolean;
  enabled: boolean;
  running: boolean;
  toggle: () => void;
}

/** CSS owns the animation clock; React only handles intent and preferences. */
export function useBackgroundMotion(active: boolean): BackgroundMotionState {
  const [enabled, setEnabled] = useState(true);
  const [environment, setEnvironment] = useState({
    allowed: false,
    foreground: false,
  });

  useEffect(() => {
    if (!active) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: DataConnection }
    ).connection;
    const update = () =>
      setEnvironment({
        allowed: !preference.matches && !connection?.saveData,
        foreground: !document.hidden && document.visibilityState !== "hidden",
      });
    const frame = requestAnimationFrame(update);
    preference.addEventListener("change", update);
    connection?.addEventListener?.("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", update);
      connection?.removeEventListener?.("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [active]);

  return {
    allowed: active && environment.allowed,
    enabled,
    running: active && enabled && environment.allowed && environment.foreground,
    toggle: () => setEnabled((current) => !current),
  };
}

export function BackgroundAtmosphere({ running }: { running: boolean }) {
  return (
    <div
      className="site-atmosphere"
      data-motion={running ? "running" : "paused"}
      aria-hidden="true"
    >
      <div className="site-atmosphere-glow site-atmosphere-glow-one" />
      <div className="site-atmosphere-glow site-atmosphere-glow-two" />
      <svg
        className="site-atmosphere-contours"
        viewBox="0 0 1440 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M-220 420C60 32 470-90 820 70s408 579 150 838c-114 114-326 186-546 175" />
        <path d="M-190 450C85 77 479-48 811 109s380 547 133 789c-113 110-307 175-512 171" />
        <path d="M-160 480C109 123 488-7 802 148s351 513 115 739c-110 106-289 163-479 165" />
        <path d="M787-110c355 37 685 285 678 591s-244 521-602 614" />
        <path d="M818-90c339 47 651 286 640 577s-242 490-580 585" />
      </svg>
    </div>
  );
}

export function BackgroundMotionControl({
  motion,
}: {
  motion: BackgroundMotionState;
}) {
  if (!motion.allowed) {
    return (
      <span className="background-motion-control background-motion-static">
        <Waves size={14} aria-hidden="true" /> Ambient light
      </span>
    );
  }
  return (
    <button
      type="button"
      className="background-motion-control"
      onClick={motion.toggle}
      aria-pressed={motion.enabled}
      aria-label={
        motion.enabled ? "Pause background motion" : "Resume background motion"
      }
    >
      {motion.enabled ? (
        <Pause size={13} aria-hidden="true" />
      ) : (
        <Play size={13} aria-hidden="true" />
      )}
      <span>{motion.enabled ? "Pause background" : "Play background"}</span>
    </button>
  );
}
