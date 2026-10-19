import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { projects, type Project } from "../lib/content";
import { projectPalettes } from "../lib/project-palettes";
import { projectPath } from "../lib/project-routes";
import { projectStudies } from "../lib/project-studies";

function ProjectPreview({
  project,
  detail,
}: {
  project: Project;
  detail?: { index: number; title: string };
}) {
  const artwork = projectStudies[project.id].previewKind === "artwork";
  const sizes = detail
    ? "(max-width: 799px) 92vw, (min-width: 1552px) 695px, 45vw"
    : "(min-width: 1552px) 1440px, 94vw";
  return (
    <picture
      className={detail ? "project-page-detail-picture" : undefined}
      data-detail={detail?.index}
    >
      <source
        type="image/avif"
        srcSet={`/assets/projects/${project.image}-640.avif 640w, /assets/projects/${project.image}-1200.avif 1200w`}
        sizes={sizes}
      />
      <img
        src={`/assets/projects/${project.image}-1200.webp`}
        srcSet={`/assets/projects/${project.image}-640.webp 640w, /assets/projects/${project.image}-1200.webp 1200w`}
        sizes={sizes}
        alt={
          detail
            ? `${project.name}: detail crop of the same ${artwork ? "project artwork" : "website preview"}, ${detail.title.toLowerCase()}`
            : `${project.name}: ${project.previewLabel || "website preview"}`
        }
        width="1200"
        height="850"
        loading={detail ? "lazy" : "eager"}
        fetchPriority={detail ? "auto" : "high"}
        decoding="async"
      />
    </picture>
  );
}

export function ProjectPage({ project }: { project: Project }) {
  const index = projects.findIndex((item) => item.id === project.id);
  const study = projectStudies[project.id];
  const palette = projectPalettes[project.id];
  const previousProject =
    projects[(index - 1 + projects.length) % projects.length];
  const nextProject = projects[(index + 1) % projects.length];
  const isArtwork = study.previewKind === "artwork";
  const sourceLabel = project.previewLabel || "Website preview";

  return (
    <main id="main" className="project-page" data-project={project.id}>
      <header className="project-page-intro page-width">
        <nav className="project-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <ChevronRight size={12} aria-hidden="true" />
              <a href="/#work">Selected work</a>
            </li>
            <li>
              <ChevronRight size={12} aria-hidden="true" />
              <span aria-current="page">{project.name}</span>
            </li>
          </ol>
        </nav>

        <div className="project-page-meta eyebrow">
          <span>Selected work / {String(index + 1).padStart(2, "0")}</span>
          <span>{project.category}</span>
          <span>{project.group}</span>
        </div>
        <h1>{project.name}</h1>

        <div className="project-page-summary">
          <h2>{study.headline}</h2>
          <div>
            <p>{study.introduction}</p>
            <a
              className="text-link project-page-visit"
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${project.name} website (opens in a new tab)`}
            >
              Visit website <ArrowUpRight size={19} aria-hidden="true" />
            </a>
            {project.previewLabel && (
              <p className="project-page-source-note">{sourceLabel}</p>
            )}
          </div>
        </div>
      </header>

      <div className="project-page-composition page-width">
        <div className="project-page-chapter eyebrow" aria-hidden="true">
          <span>01 / The composition</span>
          <span>Vital / Project perspectives</span>
        </div>
        <figure className="project-page-preview">
          <div className="project-page-frame-bar" aria-hidden="true">
            <span className="project-page-frame-dots">
              <i />
              <i />
              <i />
            </span>
            <span>{new URL(project.url).hostname}</span>
            <ArrowUpRight size={13} />
          </div>
          <ProjectPreview project={project} />
          <figcaption>
            <strong>{sourceLabel}</strong>
            <span>
              {isArtwork
                ? "Artwork shown in place of a public website preview."
                : "Captured composition. The live site may have changed."}
            </span>
          </figcaption>
        </figure>
      </div>

      <section
        className="project-page-details"
        aria-labelledby="project-details-title"
      >
        <div className="page-width">
          <div className="project-page-detail-heading">
            <p className="eyebrow">02 / Design details</p>
            <h2 id="project-details-title">
              The details shape
              <br />
              <em>the whole.</em>
            </h2>
            <p>
              A closer reading of the{" "}
              {isArtwork ? "artwork" : "visual composition"}, from its first
              impression to the finer elements.
            </p>
          </div>
          <div className="project-page-detail-grid">
            {study.observations.map((observation, detailIndex) => (
              <article className="project-page-detail" key={observation.title}>
                <figure>
                  <div className="project-page-detail-viewport">
                    <ProjectPreview
                      project={project}
                      detail={{ index: detailIndex, title: observation.title }}
                    />
                  </div>
                  <figcaption className="eyebrow">
                    <span>
                      Detail {String(detailIndex + 1).padStart(2, "0")}
                    </span>
                    <span>Crop of the same source image</span>
                  </figcaption>
                </figure>
                <div className="project-page-detail-copy">
                  <span className="eyebrow" aria-hidden="true">
                    {String(detailIndex + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{observation.title}</h3>
                    <p>{observation.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {palette && (
        <section
          className="project-page-palette page-width"
          aria-labelledby="project-colors-title"
        >
          <div className="project-page-palette-heading">
            <div>
              <p className="eyebrow">03 / Tone & contrast</p>
              <h2 id="project-colors-title">Color study</h2>
            </div>
            <p>
              Sampled from this preview. A study in the tones that bring the
              composition together.
            </p>
          </div>
          <ul
            className="project-page-colors"
            aria-label="Preview color samples"
          >
            {palette.colors.map((color, colorIndex) => (
              <li key={color} data-color-index={colorIndex}>
                <span
                  className="project-page-color-swatch"
                  aria-hidden="true"
                />
                <span className="project-page-color-label">
                  <span className="eyebrow" aria-hidden="true">
                    0{colorIndex + 1}
                  </span>
                  <span>
                    <span className="sr-only">Hexadecimal </span>
                    {color.toUpperCase()}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        className="project-page-invitation page-width"
        aria-labelledby="project-invitation-title"
      >
        <div>
          <p className="eyebrow">Your next chapter</p>
          <h2 id="project-invitation-title">
            A different idea.
            <br />
            <em>The same attention.</em>
          </h2>
        </div>
        <div>
          <p>Have a project of your own? Tell us what you’re imagining.</p>
          <a className="button button-primary" href="/#contact">
            Start a project <ArrowUpRight size={19} aria-hidden="true" />
          </a>
        </div>
      </section>

      <nav
        className="project-page-navigation page-width"
        aria-label="More projects"
      >
        {[
          {
            project: previousProject,
            label: "Previous project",
            previous: true,
          },
          { project: nextProject, label: "Next project", previous: false },
        ].map(({ project: adjacent, label, previous }) => (
          <a
            key={label}
            href={projectPath(adjacent)}
            aria-label={`${label}: ${adjacent.name}`}
          >
            <span className="project-page-nav-label eyebrow">
              {previous && <ArrowLeft size={16} aria-hidden="true" />}
              {label}
              {!previous && <ArrowRight size={16} aria-hidden="true" />}
            </span>
            <span className="project-page-nav-title">{adjacent.name}</span>
            <span className="project-page-nav-category">
              {adjacent.category}
            </span>
          </a>
        ))}
      </nav>
      <a className="project-page-back text-link" href="/#work">
        <ArrowLeft size={16} aria-hidden="true" /> All selected work
      </a>
    </main>
  );
}
