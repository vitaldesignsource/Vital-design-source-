import { useState } from "react";
import { ArrowUpRight, LayoutGrid, Rows3 } from "lucide-react";
import { projects } from "../lib/content";

const filters = [
  "All projects",
  "Culture & ideas",
  "Brands & business",
] as const;

export function Portfolio() {
  const [filter, setFilter] =
    useState<(typeof filters)[number]>("All projects");
  const [view, setView] = useState<"gallery" | "list">("gallery");
  const selected = projects.filter(
    (project) => filter === "All projects" || project.group === filter,
  );
  return (
    <section
      id="work"
      className="work-section section-space page-width"
      aria-labelledby="work-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow section-label">
            <span>01</span> Selected work
          </p>
          <h2 id="work-title">
            Work with a<br />
            <em>point of view.</em>
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
              {item === "All projects" && <sup>06</sup>}
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
          >
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${project.name} (opens in a new tab)`}
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
                    <ArrowUpRight size={12} />
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
                  View website <ArrowUpRight size={17} aria-hidden="true" />
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
                    <ArrowUpRight size={25} />
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
          </article>
        ))}
      </div>
      <p className="work-footnote eyebrow">
        Each project is its own world. Explore the live sites.
        <ArrowUpRight size={14} aria-hidden="true" />
      </p>
    </section>
  );
}
