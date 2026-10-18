import { ArrowDown, ArrowUpRight } from "lucide-react";

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-layout page-width">
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">
            <span className="signal-dot" /> Independent by nature. Vital by
            design.
          </p>
          <h1 id="hero-title">
            <span>Make your </span>
            <span>presence </span>
            <em>felt.</em>
          </h1>
          <div className="hero-intro">
            <p className="hero-description">
              Distinctive websites, identities, and intelligent systems.
              Thoughtfully connected. Unmistakably yours.
            </p>
            <div className="hero-actions">
              <a className="button button-coral" href="#contact">
                Start a conversation{" "}
                <ArrowUpRight size={20} aria-hidden="true" />
              </a>
              <a className="hero-work-link" href="#work">
                Explore our work <ArrowDown size={17} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
        <figure className="hero-artwork">
          <div className="hero-art-frame">
            <picture className="hero-art">
              <source
                type="image/avif"
                srcSet="/assets/presence-640.avif 640w, /assets/presence-1120.avif 1120w"
                sizes="(max-width: 799px) 90vw, 43vw"
              />
              <img
                src="/assets/presence-1120.webp"
                srcSet="/assets/presence-640.webp 640w, /assets/presence-1120.webp 1120w"
                sizes="(max-width: 799px) 90vw, 43vw"
                alt=""
                width="1120"
                height="1400"
                fetchPriority="high"
              />
            </picture>
            <span className="hero-art-seal eyebrow" aria-hidden="true">
              A different
              <br />
              kind of presence.
            </span>
          </div>
          <figcaption className="hero-art-caption eyebrow">
            <span>Independent thinking.</span>
            <span>Connected craft. ↗</span>
          </figcaption>
        </figure>
      </div>
      <div className="hero-bottom page-width">
        <a className="scroll-link eyebrow" href="#work">
          <ArrowDown size={17} aria-hidden="true" /> A little further. A lot to
          discover.
        </a>
        <span className="eyebrow hero-coordinate">
          Strategy / Design / Technology
        </span>
      </div>
    </section>
  );
}
