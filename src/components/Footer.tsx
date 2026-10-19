import { ArrowUpRight } from "lucide-react";
import {
  BackgroundMotionControl,
  type BackgroundMotionState,
} from "./BackgroundAtmosphere";

export function Footer({
  backgroundMotion,
}: {
  backgroundMotion?: BackgroundMotionState;
}) {
  return (
    <footer className="footer page-width">
      <div className="footer-top">
        <a
          className="footer-crest"
          href="/#top"
          aria-label="Vital Design Source home"
        >
          <img
            src="/assets/brand/vital-logo-original.webp"
            alt="Vital Design Source LLC official heraldic crest"
            width="144"
            height="142"
            loading="lazy"
          />
        </a>
        <p>
          Creative instinct.
          <br />
          <em>Technical precision.</em>
        </p>
        <a className="back-top text-link" href="#top">
          Back to top <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        Vital by design
        <span>
          <ArrowUpRight strokeWidth={1.2} />
        </span>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Vital Design Source LLC</span>
        <nav aria-label="Footer">
          <a href="/#work">Work</a>
          <a href="/#ai-studio">AI Studio</a>
          <a href="/#services">Services</a>
          <a href="/#contact">Contact</a>
          <a href="/privacy">Privacy</a>
        </nav>
        {backgroundMotion && (
          <BackgroundMotionControl motion={backgroundMotion} />
        )}
        <span>Design with a pulse.</span>
      </div>
    </footer>
  );
}
