import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Expand,
  Image as ImageIcon,
  Monitor,
  X,
} from "lucide-react";
import { projects } from "../lib/content";
import { projectStudies } from "../lib/project-studies";

interface ProjectShowcaseProps {
  initialProjectId: string;
  onClose: () => void;
}

export function ProjectShowcase({
  initialProjectId,
  onClose,
}: ProjectShowcaseProps) {
  const modal = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [projectIndex, setProjectIndex] = useState(() =>
    Math.max(
      0,
      projects.findIndex((project) => project.id === initialProjectId),
    ),
  );
  const [preview, setPreview] = useState<"desktop" | "detail">("desktop");
  const project = projects[projectIndex];
  const study = projectStudies[project.id];
  const isCover = study.previewKind === "cover";
  const previousProject =
    projects[(projectIndex - 1 + projects.length) % projects.length];
  const nextProject = projects[(projectIndex + 1) % projects.length];
  const projectNumber = String(projectIndex + 1).padStart(2, "0");

  useEffect(() => {
    const dialog = modal.current;
    if (!dialog) return;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  const moveProject = (step: number) => {
    setProjectIndex(
      (index) => (index + step + projects.length) % projects.length,
    );
    setPreview("desktop");
    window.requestAnimationFrame(() => {
      modal.current?.scrollTo({ top: 0, behavior: "instant" });
      heading.current?.focus({ preventScroll: true });
    });
  };

  return (
    <dialog
      ref={modal}
      className="project-showcase"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="showcase-topbar">
        <p className="eyebrow">
          <span className="showcase-status-dot" aria-hidden="true" />
          Vital / Project perspectives
        </p>
        <button
          className="showcase-close"
          type="button"
          onClick={onClose}
          aria-label="Close project showcase"
        >
          <span>Close</span>
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="showcase-intro">
        <div className="showcase-project-meta eyebrow">
          <span>
            {projectNumber} / {String(projects.length).padStart(2, "0")}
          </span>
          <span>{project.category}</span>
        </div>
        <h2 ref={heading} id={titleId} tabIndex={-1}>
          {project.name}
        </h2>
        <div className="showcase-summary-row">
          <p id={descriptionId}>{study.introduction}</p>
          <a
            className="showcase-visit"
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${project.name} website (opens in a new tab)`}
          >
            Visit website <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="showcase-preview-toolbar">
        <div
          className="showcase-view-switch"
          role="group"
          aria-label="Project preview"
        >
          <button
            type="button"
            aria-pressed={preview === "desktop"}
            onClick={() => setPreview("desktop")}
          >
            {isCover ? (
              <ImageIcon size={15} aria-hidden="true" />
            ) : (
              <Monitor size={15} aria-hidden="true" />
            )}
            {isCover
              ? "Project cover"
              : study.previewKind === "artwork"
                ? "Artwork"
                : "Desktop"}
          </button>
          {!isCover && (
            <button
              type="button"
              aria-pressed={preview === "detail"}
              onClick={() => setPreview("detail")}
            >
              <Expand size={14} aria-hidden="true" /> Detail
            </button>
          )}
        </div>
        <p className="showcase-source-label eyebrow">
          {project.previewLabel || "Website preview"}
        </p>
      </div>

      <figure
        className="showcase-display"
        data-preview={preview}
        data-project={project.id}
      >
        {!isCover && (
          <div className="showcase-browser-bar" aria-hidden="true">
            <span className="showcase-window-dots">
              <i />
              <i />
              <i />
            </span>
            <span>{new URL(project.url).hostname}</span>
            <ArrowUpRight size={12} />
          </div>
        )}
        <div className="showcase-image-viewport">
          <picture className="showcase-image">
            <source
              type="image/avif"
              srcSet={`/assets/projects/${project.image}-640.avif 640w, /assets/projects/${project.image}-1200.avif 1200w`}
              sizes="(min-width: 1304px) 1200px, 92vw"
            />
            <img
              src={`/assets/projects/${project.image}-1200.webp`}
              srcSet={`/assets/projects/${project.image}-640.webp 640w, /assets/projects/${project.image}-1200.webp 1200w`}
              sizes="(min-width: 1304px) 1200px, 92vw"
              alt={`${project.name}: ${project.previewLabel || "desktop website preview"}${preview === "detail" ? ", detail crop of the same image" : ""}`}
              width="1200"
              height="850"
              decoding="async"
            />
          </picture>
        </div>
        <figcaption className="showcase-image-caption eyebrow">
          <span>
            {isCover
              ? "Project cover"
              : study.previewKind === "artwork"
                ? "Project artwork"
                : "Digital composition"}
          </span>
          <span>
            {isCover
              ? "Website preview unavailable"
              : preview === "detail"
                ? "Detail crop · same source image"
                : "Full composition"}
          </span>
        </figcaption>
      </figure>

      {study.observations.length > 0 && (
        <div className="showcase-story">
          <div className="showcase-story-heading">
            <p className="eyebrow">A closer look</p>
            <h3>{study.headline}</h3>
          </div>
          <div className="showcase-observations">
            {study.observations.map((observation, index) => (
              <div className="showcase-observation" key={observation.title}>
                <span className="eyebrow" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4>{observation.title}</h4>
                <p>{observation.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {project.name}. Project {projectIndex + 1} of {projects.length}.
      </p>
      <nav className="showcase-navigation" aria-label="Explore projects">
        <button type="button" onClick={() => moveProject(-1)}>
          <ArrowLeft size={21} aria-hidden="true" />
          <span>
            <span className="eyebrow">Previous project</span>
            <strong>{previousProject.name}</strong>
          </span>
        </button>
        <button type="button" onClick={() => moveProject(1)}>
          <span>
            <span className="eyebrow">Next project</span>
            <strong>{nextProject.name}</strong>
          </span>
          <ArrowRight size={21} aria-hidden="true" />
        </button>
      </nav>
    </dialog>
  );
}
