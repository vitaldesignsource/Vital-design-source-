import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, Pause, Play } from "lucide-react";
import { CrestSculpture } from "./CrestSculpture";

export function Hero() {
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!preference.matches);
    const frame = requestAnimationFrame(update);
    preference.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", update);
    };
  }, []);
  return (
    <section
      className="hero"
      aria-labelledby="hero-title"
      data-motion={motion ? "running" : "paused"}
    >
      <div className="hero-scene page-width">
        <div className="hero-layout">
          <div className="hero-content">
            <p className="eyebrow hero-eyebrow">
              <span className="signal-dot" /> Independent minds. New dimensions.
            </p>
            <h1 id="hero-title">
              <span>Ideas beyond </span>
              <em>ordinary.</em>
            </h1>
            <p className="hero-description">
              Human imagination. AI-enhanced creativity. We build distinctive
              brands, immersive websites, and visual worlds that move you.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#contact">
                Let’s create something{" "}
                <ArrowUpRight size={19} aria-hidden="true" />
              </a>
              <a className="hero-work-link" href="#brand-film">
                <Play size={16} aria-hidden="true" /> Watch the brand film
              </a>
            </div>
            <div className="hero-disciplines eyebrow">
              <span>Design</span>
              <span>Intelligence</span>
              <span>Motion</span>
            </div>
          </div>
          <figure
            className="hero-artwork"
            aria-label="Sculpted silver Vital Design Source heraldic crest"
          >
            <CrestSculpture active={motion} />
            <figcaption className="hero-crest-caption eyebrow">
              Heritage, reimagined.
            </figcaption>
          </figure>
        </div>
        <div className="hero-bottom">
          <a className="scroll-link eyebrow" href="#work">
            <ArrowDown size={16} aria-hidden="true" /> Scroll to discover
          </a>
          <span className="hero-coordinate eyebrow">
            Built at the intersection of art & technology
          </span>
          <button
            className="hero-motion-toggle"
            type="button"
            onClick={() => setMotion(!motion)}
            aria-label={motion ? "Pause hero motion" : "Resume hero motion"}
          >
            {motion ? (
              <Pause size={14} aria-hidden="true" />
            ) : (
              <Play size={14} aria-hidden="true" />
            )}
            <span>{motion ? "Pause motion" : "Play motion"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
