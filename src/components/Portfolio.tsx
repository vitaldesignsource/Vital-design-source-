import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  LayoutGrid,
  Monitor,
  Rows3,
} from "lucide-react";
import { projects } from "../lib/content";
import { projectStudies } from "../lib/project-studies";
import { projectPath } from "../lib/project-routes";
import { ProjectShowcase } from "./ProjectShowcase";
import { SectionContours } from "./SectionContours";
import "../styles/portfolio-discovery.css";

const filters = [
  "All projects",
  "Culture & ideas",
  "Brands & business",
] as const;

export function Portfolio() {
  const [filter, setFilter] =
    useState<(typeof filters)[number]>("All projects");
  const [view, setView] = useState<"gallery" | "list">("gallery");
  const [showcaseProject, setShowcaseProject] = useState<string | null>(null);
  const selected = projects.filter(
    (project) => filter === "All projects" || project.group === filter,
  );
  return (
    <section
      id="work"
      className="work-section section-space page-width"
      aria-labelledby="work-title"
    >
      <SectionContours variant="work" />
      <div className="section-heading">
        <div>
          <p className="eyebrow section-label">
            <span>01</span> Selected work
          </p>
          <h2 id="work-title">
            Built with purpose.
            <br />
            <em>Designed to stand apart.</em>
          </h2>
        </div>
        <p>
          Different industries. Independent voices. Websites and identities
          shaped around the people behind them.
        </p>
      </div>
      <div className="work-toolbar">
        <div className="filter-list" role="group" aria-label="Filter projects">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {item}
              {item === "All projects" && (
                <sup>{String(projects.length).padStart(2, "0")}</sup>
              )}
            </button>
          ))}
        </div>
        <div className="work-toolbar-end">
          <p className="eyebrow work-count" role="status" aria-live="polite">
            {String(selected.length).padStart(2, "0")} projects
          </p>
          <div className="view-switch" role="group" aria-label="Portfolio view">
            <button
              type="button"
              aria-label="Gallery view"
              aria-pressed={view === "gallery"}
              onClick={() => setView("gallery")}
            >
              <LayoutGrid size={17} aria-hidden="true" />
              <span>Gallery</span>
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <Rows3 size={18} aria-hidden="true" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>
      <div className="project-grid" data-view={view}>
        {selected.map((project, index) => (
          <article
            key={project.id}
            className={`project project-${project.id}${index === 0 ? " project-featured" : ""}`}
            data-preview-kind={projectStudies[project.id].previewKind}
          >
            <a
              href={projectPath(project)}
              aria-label={`View ${project.name} project study`}
            >
              <div className="project-visual">
                <div className="project-image-shell">
                  <div className="project-window-bar" aria-hidden="true">
                    <span className="window-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>{new URL(project.url).hostname}</span>
                    <Monitor size={12} />
                  </div>
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={`/assets/projects/${project.image}-640.avif 640w, /assets/projects/${project.image}-1200.avif 1200w`}
                      sizes="(max-width: 799px) 92vw, (min-width: 1440px) 800px, 60vw"
                    />
                    <img
                      src={`/assets/projects/${project.image}-1200.webp`}
                      srcSet={`/assets/projects/${project.image}-640.webp 640w, /assets/projects/${project.image}-1200.webp 1200w`}
                      sizes="(max-width: 799px) 92vw, (min-width: 1440px) 800px, 60vw"
                      alt={`${project.name} ${project.previewLabel || "website preview"}`}
                      width="1200"
                      height="850"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                </div>
                {project.previewLabel && (
                  <span className="project-preview-label eyebrow">
                    {project.previewLabel}
                  </span>
                )}
                <span className="project-hover eyebrow">
                  View project study <ArrowRight size={17} aria-hidden="true" />
                </span>
              </div>
              <div className="project-info">
                <div className="project-heading-row eyebrow">
                  <span className="project-index">
                    {String(projects.indexOf(project) + 1).padStart(2, "0")}
                  </span>
                  <p>{project.category}</p>
                </div>
                <div className="project-title-row">
                  <h3>{project.name}</h3>
                  <span className="project-open" aria-hidden="true">
                    <ArrowRight size={25} />
                  </span>
                </div>
                <p className="project-description">{project.description}</p>
                {project.previewLabel && (
                  <p className="project-preview-note eyebrow">
                    {project.previewLabel}
                  </p>
                )}
              </div>
            </a>
            <div className="project-study-actions">
              <a
                className="project-external-link"
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${project.name} (opens in a new tab)`}
              >
                Visit website <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <button
                className="project-study-trigger"
                type="button"
                aria-label={`Explore ${project.name}`}
                aria-haspopup="dialog"
                onClick={(event) => {
                  event.currentTarget.focus({ preventScroll: true });
                  setShowcaseProject(project.id);
                }}
              >
                A closer look <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="work-discovery-footer">
        <div className="work-discovery-copy">
          <p className="eyebrow">Your next step</p>
          <h3>From inspiration to possibility.</h3>
          <p>Explore what we do, or tell us what you have in mind.</p>
        </div>
        <div className="work-discovery-links">
          <a className="text-link" href="#services">
            Explore capabilities <ArrowRight size={17} aria-hidden="true" />
          </a>
          <a className="button button-primary" href="#contact">
            Start a project <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
      {showcaseProject && (
        <ProjectShowcase
          initialProjectId={showcaseProject}
          onClose={() => setShowcaseProject(null)}
        />
      )}
    </section>
  );
}
