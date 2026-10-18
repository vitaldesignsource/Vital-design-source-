import { ArrowRight, ArrowUpRight } from "lucide-react";

const process = [
  {
    title: "Discover",
    description:
      "Get to the heart of your idea. Ask the questions that matter.",
  },
  {
    title: "Design",
    description: "Explore the possibilities. Give the direction its character.",
  },
  {
    title: "Develop",
    description: "Connect the design and the technology, detail by detail.",
  },
  {
    title: "Refine",
    description:
      "Test, consider, and polish. Make every part feel intentional.",
  },
];

export function Studio() {
  return (
    <section
      id="studio"
      className="studio-section section-space"
      aria-labelledby="studio-title"
    >
      <div className="page-width">
        <div className="studio-heading">
          <p className="eyebrow section-label">
            <span>04 /</span> The Vital perspective
          </p>
          <h2 id="studio-title">
            Independent thinking.
            <br />
            Connected <em>by design.</em>
          </h2>
        </div>

        <div className="studio-statement">
          <figure className="studio-emblem">
            <div className="studio-emblem-art">
              <img
                src="/assets/brand/vital-logo-original.webp"
                width="1100"
                height="1085"
                alt="The official Vital Design Source heraldic crest"
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption className="eyebrow">
              Vital Design Source <span>Independent creative studio</span>
            </figcaption>
          </figure>

          <div className="studio-copy">
            <p className="studio-lead">
              Design, development, and digital intelligence belong in the same
              conversation.
            </p>
            <p>
              We’re an independent studio with an eye for the whole picture. The
              identity people see. The experience they move through. The systems
              working behind the scenes.
            </p>
            <p>
              We bring these parts together with a clear point of view, close
              attention, and room for the unexpected. Work shaped around your
              idea, with care in every detail.
            </p>
            <a className="text-link" href="#contact">
              Meet your next creative partner{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="process-header">
          <p className="eyebrow">Our approach</p>
          <p>A clear process. Room to explore.</p>
        </div>
        <div className="process-strip">
          {process.map((step, index) => (
            <article key={step.title}>
              <p className="eyebrow">
                0{index + 1}
                <ArrowRight size={18} aria-hidden="true" />
              </p>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
