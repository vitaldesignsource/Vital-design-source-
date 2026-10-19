import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  AudioLines,
  Image,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import {
  designDirections,
  type DesignDirection,
} from "../lib/design-directions";
import { useVisibleMotion } from "../lib/use-visible-motion";
import { DesignLabArtwork } from "./DesignLabArtwork";

const capabilities = [
  {
    icon: Image,
    title: "Image & art direction",
    description:
      "Distinctive imagery and visual concepts, shaped with AI tools and a human point of view.",
  },
  {
    icon: AudioLines,
    title: "Motion & visual worlds",
    description:
      "Atmospheric motion, expressive graphics, and visual systems that carry an idea beyond a still image.",
  },
  {
    icon: Sparkles,
    title: "Intelligent experiences",
    description:
      "Interactive websites and considered AI workflows that connect creative ambition with practical purpose.",
  },
] as const;

export function DesignLab({
  onExploreDirection,
}: {
  onExploreDirection?: (direction: DesignDirection) => void;
}) {
  const [directionId, setDirectionId] =
    useState<DesignDirection["id"]>("chrome");
  const [motionEnabled, setMotionEnabled] = useState(false);
  const { ref: stage, running: motionRunning } =
    useVisibleMotion<HTMLDivElement>(motionEnabled);
  const direction =
    designDirections.find((item) => item.id === directionId) ??
    designDirections[0];
  const directionNumber = String(
    designDirections.indexOf(direction) + 1,
  ).padStart(2, "0");

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const applyPreference = () =>
      setMotionEnabled(!preference.matches && !connection?.saveData);
    const frame = window.requestAnimationFrame(applyPreference);
    preference.addEventListener("change", applyPreference);
    return () => {
      window.cancelAnimationFrame(frame);
      preference.removeEventListener("change", applyPreference);
    };
  }, []);

  return (
    <section
      id="ai-studio"
      className="design-lab section-space page-width"
      aria-labelledby="lab-title"
    >
      <div className="section-heading lab-heading">
        <div>
          <p className="eyebrow section-label">
            <span>02</span> AI Design Lab
          </p>
          <h2 id="lab-title">
            Human imagination.
            <br />
            <em>New dimensions.</em>
          </h2>
        </div>
        <p>
          New tools. An unmistakably human perspective. Explore a few visual
          directions at the intersection of art, design, and intelligence.
        </p>
      </div>

      <div className="lab-layout">
        <div
          ref={stage}
          className="lab-stage"
          data-direction={direction.id}
          data-motion={motionRunning ? "running" : "paused"}
          aria-hidden="true"
        >
          <DesignLabArtwork direction={direction.id} />
          <div className="lab-stage-meta eyebrow">
            <span>Vital / Visual explorations</span>
            <span>{directionNumber} / 03</span>
          </div>
          <span className="lab-stage-word">{direction.name}</span>
          <span className="lab-stage-caption eyebrow">
            Art direction in another dimension
          </span>
        </div>

        <div className="lab-controls">
          <p className="eyebrow lab-control-label">Choose a direction</p>
          <div
            className="lab-direction-switch"
            role="group"
            aria-label="Art direction"
          >
            {designDirections.map((item, index) => (
              <button
                className="lab-direction-button"
                data-direction={item.id}
                key={item.id}
                type="button"
                aria-pressed={direction.id === item.id}
                onClick={() => setDirectionId(item.id)}
              >
                <span className="lab-direction-swatch" aria-hidden="true" />
                <span>{item.name}</span>
                <span
                  className="eyebrow lab-direction-number"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>

          <div className="lab-brief" role="status" aria-live="polite">
            <p className="eyebrow lab-selected-direction">
              {direction.name} / Creative brief
            </p>
            <h3>{direction.title}</h3>
            <p>{direction.brief}</p>
          </div>

          <div className="lab-materials">
            {direction.materials.map((material) => (
              <span className="eyebrow" key={material}>
                {material}
              </span>
            ))}
          </div>

          <button
            type="button"
            className="lab-motion-toggle eyebrow"
            aria-label={motionEnabled ? "Pause motion" : "Resume motion"}
            onClick={() => setMotionEnabled((enabled) => !enabled)}
          >
            {motionEnabled ? (
              <Pause size={14} aria-hidden="true" />
            ) : (
              <Play size={14} aria-hidden="true" />
            )}
            {motionEnabled ? "Pause motion" : "Resume motion"}
          </button>

          <a
            className="button button-primary lab-cta"
            href="#contact"
            onClick={() => onExploreDirection?.(direction)}
          >
            Explore this direction
            <ArrowUpRight size={19} aria-hidden="true" />
          </a>
          <p className="lab-study-note">
            An interactive art-direction study. Your project starts with a
            conversation.
          </p>
        </div>
      </div>

      <div className="lab-capabilities">
        {capabilities.map((capability) => {
          const Icon = capability.icon;
          return (
            <article className="lab-capability" key={capability.title}>
              <span className="lab-capability-icon">
                <Icon size={23} aria-hidden="true" />
              </span>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
