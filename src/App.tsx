import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { InquiryForm, type InquiryFormHandle } from "./components/InquiryForm";
import { Portfolio } from "./components/Portfolio";
import { Services } from "./components/Services";
import { Studio } from "./components/Studio";
import { DesignLab } from "./components/DesignLab";
import { BrandFilm } from "./components/BrandFilm";
import { SignalBanner } from "./components/SignalBanner";
import { ScrollChoreography } from "./components/ScrollChoreography";
import { ProjectPage } from "./components/ProjectPage";
import { AIWorkflow } from "./components/AIWorkflow";
import { getProjectFromPath } from "./lib/project-routes";
import { getProjectReference } from "./lib/project-reference";
import {
  BackgroundAtmosphere,
  useBackgroundMotion,
} from "./components/BackgroundAtmosphere";
import {
  startingPointFromDirection,
  startingPointFromService,
  startingPointFromWorkflow,
  startingPointFromProject,
} from "./lib/creative-starting-point";

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
  const inquiryRef = useRef<InquiryFormHandle>(null);
  const project = getProjectFromPath(path);
  const backgroundMotion = useBackgroundMotion(path === "/");
  useEffect(() => {
    if (path !== "/") return;
    const parameters = new URLSearchParams(window.location.search);
    if (!parameters.has("reference")) return;
    const reference = getProjectReference(window.location.search);
    if (reference)
      inquiryRef.current?.chooseStartingPoint(
        startingPointFromProject(reference),
      );
    // Consume this public selection once, including unsupported/duplicate IDs.
    // Reloading after clearing a starting point should not restore it.
    parameters.delete("reference");
    const query = parameters.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }, [path]);
  return (
    <div id="top">
      {path === "/" && (
        <BackgroundAtmosphere running={backgroundMotion.running} />
      )}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header inFlow={Boolean(project)} />
      {path === "/" ? (
        <main id="main">
          <ScrollChoreography />
          <Hero backgroundMotion={backgroundMotion} />
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
          <DesignLab
            onExploreDirection={(direction) =>
              inquiryRef.current?.chooseStartingPoint(
                startingPointFromDirection(direction),
              )
            }
          />
          <AIWorkflow
            onExploreWorkflow={(example) =>
              inquiryRef.current?.chooseStartingPoint(
                startingPointFromWorkflow(example),
              )
            }
          />
          <Services
            onSelectService={(service) =>
              inquiryRef.current?.chooseStartingPoint(
                startingPointFromService(service),
              )
            }
          />
          <Studio />
          <SignalBanner />
          <InquiryForm ref={inquiryRef} />
        </main>
      ) : project ? (
        <ProjectPage project={project} />
      ) : path === "/privacy" || path === "/privacy/" ? (
        <Privacy />
      ) : (
        <NotFound />
      )}
      <Footer backgroundMotion={path === "/" ? backgroundMotion : undefined} />
    </div>
  );
}
