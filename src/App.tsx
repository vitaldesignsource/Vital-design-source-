import { ArrowRight, ArrowUpRight, Asterisk } from "lucide-react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { InquiryForm } from "./components/InquiryForm";
import { Portfolio } from "./components/Portfolio";
import { Services } from "./components/Services";

function Studio() {
  return (
    <section
      id="studio"
      className="studio-section section-space page-width"
      aria-labelledby="studio-title"
    >
      <p className="eyebrow section-label">
        <span>03</span> The Vital perspective
      </p>
      <div className="studio-statement">
        <h2 id="studio-title">
          Good design <br />
          moves <em>people.</em>
        </h2>
        <div className="studio-copy">
          <span className="studio-asterisk" aria-hidden="true">
            <Asterisk aria-hidden="true" strokeWidth={1.3} />
          </span>
          <p>
            We’re an independent creative studio connecting design, development,
            and digital intelligence.
          </p>
          <p>
            We believe the strongest work comes from seeing the whole picture.
            The brand. The experience. The systems behind it. Every part working
            together, with a little something you can’t quite put your finger
            on.
          </p>
          <a className="text-link" href="#contact">
            Make your mark <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="process-strip">
        {[
          ["Discover", "Find the right questions."],
          ["Design", "Give the idea its character."],
          ["Develop", "Bring every detail to life."],
          ["Refine", "Make it ready for what’s next."],
        ].map(([title, copy], index) => (
          <article key={title}>
            <p className="eyebrow">
              0{index + 1}
              <ArrowRight size={16} aria-hidden="true" />
            </p>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

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
      <a className="button button-coral" href="/">
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
              <span>Design that connects.</span>
              <span>Web / Brand / Development / SEO / Automation</span>
              <span aria-hidden="true">↘</span>
            </div>
          </div>
          <Portfolio />
          <Services />
          <Studio />
          <div className="signal-strip" aria-hidden="true">
            <span>Built with intention.</span>
            <span>Made to move you.</span>
            <span>
              <Asterisk aria-hidden="true" strokeWidth={1.3} />
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
