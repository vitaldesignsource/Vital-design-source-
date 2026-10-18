import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { InquiryForm } from "./components/InquiryForm";
import { Portfolio } from "./components/Portfolio";
import { Services } from "./components/Services";
import { Studio } from "./components/Studio";
import { DesignLab } from "./components/DesignLab";
import { BrandFilm } from "./components/BrandFilm";

function Privacy() {
  return (
    <main id="main" className="legal page-width">
      <p className="eyebrow">Your information, respected.</p>
      <h1>Privacy notice</h1>
      <p className="legal-intro">
        We use the information you share to have a conversation about your
        project.
      </p>
      <p>Effective October 18, 2026</p>
      <h2>What we collect</h2>
      <p>
        When you submit a project inquiry, we collect your name, email address,
        optional company name, project type, budget preference, message, and
        consent. Please do not include sensitive personal information.
      </p>
      <h2>How we use it</h2>
      <p>
        Vital Design Source LLC uses your information to review and respond to
        your inquiry. Submissions are stored in a private database on the
        website’s server. If email notifications are configured, your submission
        is also sent to the studio through its email provider. We do not sell
        your information or add you to a mailing list.
      </p>
      <h2>Security and retention</h2>
      <p>
        We use restricted storage, validation, and abuse protection. For rate
        limiting, a keyed hash of your network address is stored for up to one
        hour; raw network addresses are not stored by the inquiry application.
        Inquiries are automatically removed from the website database after 180
        days. Server hosts and email providers may retain separate operational
        records under their own policies. Correspondence that becomes part of an
        ongoing client relationship may be retained separately.
      </p>
      <h2>Cookies and third parties</h2>
      <p>
        This website does not set analytics or advertising cookies. Fonts and
        visual assets are served from this website. Links to project websites
        open independent sites whose privacy practices may differ.
      </p>
      <h2>Your choices</h2>
      <p>
        You can request access, correction, or deletion of an inquiry by using
        the <a href="/#contact">project inquiry form</a>. Include “Privacy
        request” in your message and use the same email address as your original
        inquiry so we can verify and respond to your request.
      </p>
      <a className="text-link" href="/">
        Return to the studio <ArrowUpRight size={18} aria-hidden="true" />
      </a>
    </main>
  );
}

function NotFound() {
  return (
    <main id="main" className="not-found page-width">
      <p className="eyebrow">404 / A little off course</p>
      <h1>
        Let’s find <br />
        the <em>signal.</em>
      </h1>
      <p>
        The page you’re looking for isn’t here. There’s plenty to explore back
        at the studio.
      </p>
      <a className="button button-primary" href="/">
        Back to the studio <ArrowUpRight size={20} aria-hidden="true" />
      </a>
    </main>
  );
}

export function App({ path = "/" }: { path?: string }) {
  return (
    <div id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      {path === "/" ? (
        <main id="main">
          <Hero />
          <div className="discipline-bar">
            <div className="page-width eyebrow">
              <span>
                <span className="signal-dot" /> Design with a pulse.
              </span>
              <span>Design / Development / AI / Motion / Automation</span>
              <span aria-hidden="true">
                <ArrowDownRight size={18} />
              </span>
            </div>
          </div>
          <BrandFilm />
          <Portfolio />
          <DesignLab />
          <Services />
          <Studio />
          <div className="signal-strip" aria-hidden="true">
            <span>Human imagination.</span>
            <em>Extraordinary possibilities.</em>
            <span>
              <ArrowUpRight />
            </span>
          </div>
          <InquiryForm />
        </main>
      ) : path === "/privacy" ? (
        <Privacy />
      ) : (
        <NotFound />
      )}
      <Footer />
    </div>
  );
}
