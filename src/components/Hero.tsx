import { ArrowDown, ArrowUpRight } from "lucide-react";

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <picture className="hero-art">
        <source
          type="image/avif"
          srcSet="/assets/hero-960.avif 960w, /assets/hero-1600.avif 1600w"
          sizes="100vw"
        />
        <img
          src="/assets/hero-1600.webp"
          srcSet="/assets/hero-960.webp 960w, /assets/hero-1600.webp 1600w"
          sizes="100vw"
          alt=""
          width="1600"
          height="1067"
          fetchPriority="high"
        />
      </picture>
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-content page-width">
        <p className="eyebrow hero-eyebrow">
          <span className="signal-dot" /> Independent creative studio
        </p>
        <h1 id="hero-title">
          Digital <br />
          experiences <br />
          with a <em>pulse.</em>
        </h1>
        <p className="hero-description">
          Distinctive websites, brands, and intelligent systems. Built with
          intention. Made to move you.
        </p>
        <a className="button button-coral" href="#contact">
          Start a project <ArrowUpRight size={20} aria-hidden="true" />
        </a>
      </div>
      <div className="hero-bottom page-width">
        <a className="scroll-link eyebrow" href="#work">
          <span className="scroll-circle">
            <ArrowDown size={17} aria-hidden="true" />
          </span>
          Scroll to explore
        </a>
        <span className="eyebrow hero-coordinate">
          Strategy / Design / Technology
        </span>
        <span className="eyebrow hero-number">01 — 06</span>
      </div>
    </section>
  );
}
