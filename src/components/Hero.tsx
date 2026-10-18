import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, Pause, Play, Sparkles } from "lucide-react";
import { AmbientField } from "./AmbientField";

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
        <AmbientField active={motion} />
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
              <a className="hero-work-link" href="#ai-studio">
                <Sparkles size={16} aria-hidden="true" /> Explore the AI studio
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
            aria-label="AI-assisted liquid chrome artwork"
          >
            <picture className="hero-art">
              <source
                type="image/avif"
                srcSet="/assets/neural-640.avif 640w, /assets/neural-1280.avif 1280w"
                sizes="(max-width: 799px) 100vw, 60vw"
              />
              <img
                src="/assets/neural-1280.webp"
                srcSet="/assets/neural-640.webp 640w, /assets/neural-1280.webp 1280w"
                sizes="(max-width: 799px) 100vw, 60vw"
                alt=""
                width="1280"
                height="1280"
                fetchPriority="high"
              />
            </picture>
            <figcaption className="hero-art-caption">
              <span className="hero-caption-mark" aria-hidden="true">
                <Sparkles size={16} />
              </span>
              <span>
                Artificial intelligence.
                <br />
                <strong>Distinctly human vision.</strong>
              </span>
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
