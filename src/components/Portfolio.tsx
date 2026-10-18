import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { projects } from "../lib/content";

const filters = [
  "All projects",
  "Culture & ideas",
  "Brands & business",
] as const;

export function Portfolio() {
  const [filter, setFilter] =
    useState<(typeof filters)[number]>("All projects");
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
            Ideas made <em>real.</em>
          </h2>
        </div>
        <p>
          A few different worlds.
          <br />
          The same attention to detail.
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
        <p className="eyebrow work-count" role="status" aria-live="polite">
          {String(selected.length).padStart(2, "0")} projects
        </p>
      </div>
      <div className="project-grid">
        {selected.map((project) => (
          <article key={project.id} className={`project project-${project.id}`}>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${project.name} (opens in a new tab)`}
            >
              <div className="project-visual">
                <picture>
                  <source
                    type="image/avif"
                    srcSet={`/assets/projects/${project.image}-640.avif 640w, /assets/projects/${project.image}-1200.avif 1200w`}
                    sizes="(max-width: 799px) 92vw, 44vw"
                  />
                  <img
                    src={`/assets/projects/${project.image}-1200.webp`}
                    srcSet={`/assets/projects/${project.image}-640.webp 640w, /assets/projects/${project.image}-1200.webp 1200w`}
                    sizes="(max-width: 799px) 92vw, 44vw"
                    alt={`${project.name} ${project.previewLabel || "website preview"}`}
                    width="1200"
                    height="850"
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
                {project.previewLabel && (
                  <span className="project-preview-label eyebrow">
                    {project.previewLabel}
                  </span>
                )}
                <span className="project-index eyebrow">
                  {String(projects.indexOf(project) + 1).padStart(2, "0")} / 06
                </span>
                <span className="project-open">
                  <ArrowUpRight size={25} aria-hidden="true" />
                  <span className="sr-only">Open website</span>
                </span>
                <span className="project-hover eyebrow">
                  Explore project <ArrowUpRight size={17} aria-hidden="true" />
                </span>
              </div>
              <div className="project-info">
                <p className="eyebrow">{project.category}</p>
                <h3>{project.name}</h3>
                <p className="project-description">{project.description}</p>
              </div>
            </a>
          </article>
        ))}
      </div>
      <p className="work-footnote eyebrow">
        Explore the live projects <ArrowUpRight size={14} aria-hidden="true" />
      </p>
    </section>
  );
}
