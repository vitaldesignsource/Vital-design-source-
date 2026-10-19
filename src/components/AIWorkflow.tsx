import { useId, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Layers3,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import {
  workflowExamples,
  type WorkflowExample,
  type WorkflowStage,
} from "../lib/workflow-examples";

const stages = [
  {
    id: "capture",
    name: "Capture",
    caption: "The original message",
    icon: ScanLine,
  },
  {
    id: "organize",
    name: "Organize",
    caption: "A structured outline",
    icon: Layers3,
  },
  {
    id: "review",
    name: "Review",
    caption: "A human checkpoint",
    icon: ShieldCheck,
  },
  {
    id: "handoff",
    name: "Handoff",
    caption: "A suggested next step",
    icon: ArrowUpRight,
  },
] as const;

function WorkflowMap({ active }: { active: number }) {
  const gradient = `workflow-signal-${useId().replaceAll(":", "")}`;

  return (
    <svg
      className="workflow-map"
      viewBox="0 0 480 178"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={gradient}
          x1="40"
          y1="90"
          x2="440"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--aurora-blue)" />
          <stop offset="0.55" stopColor="var(--aurora)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <g className="workflow-map-grid">
        <path d="M24 24h14m-14 0v14m432-14h-14m14 0v14M24 154h14m-14 0v-14m432 14h-14m14 0v-14" />
        <path
          d="M60 36v106M180 36v106M300 36v106M420 36v106M24 89h432"
          strokeDasharray="2 7"
        />
        <path d="M60 62c65-53 55 107 120 54s55-53 120 0 55-107 120-54" />
      </g>
      <path
        className="workflow-map-route"
        d="M60 89h360"
        stroke={`url(#${gradient})`}
        pathLength="1"
      />
      {stages.map((stage, index) => (
        <g
          key={stage.id}
          className="workflow-map-node"
          data-active={active === index}
          data-reviewed={index === 2}
        >
          <circle
            className="workflow-map-node-orbit"
            cx={60 + index * 120}
            cy="89"
            r="27"
          />
          <circle
            className="workflow-map-node-core"
            cx={60 + index * 120}
            cy="89"
            r="17"
          />
          <text
            x={60 + index * 120}
            y="93"
            textAnchor="middle"
            className="workflow-map-node-number"
          >
            0{index + 1}
          </text>
          <text
            x={60 + index * 120}
            y="142"
            textAnchor="middle"
            className="workflow-map-node-label"
          >
            {stage.name}
          </text>
        </g>
      ))}
      <g className="workflow-map-marker">
        <path d="m287 40 7 7 13-13" />
        <path d="M284 27h32v27h-32z" />
      </g>
    </svg>
  );
}

function WorkflowOutput({
  example,
  stage,
}: {
  example: WorkflowExample;
  stage: WorkflowStage;
}) {
  if (stage === "capture") {
    return (
      <>
        <h3 id="workflow-output-title">Start with what you know.</h3>
        <p className="workflow-output-intro">
          Keep the original message alongside the outline. Intent and context
          should survive the handoff.
        </p>
        <div className="workflow-capture-note">
          <FileText size={24} strokeWidth={1.4} aria-hidden="true" />
          <div>
            <p className="eyebrow">Source preserved</p>
            <p>{example.input.label}</p>
          </div>
        </div>
        <div className="workflow-output-footnote">
          <p className="eyebrow">Before anything else</p>
          <p>
            Identify the request, the material already available, and the
            questions that still need an answer.
          </p>
        </div>
      </>
    );
  }

  if (stage === "organize") {
    return (
      <>
        <h3 id="workflow-output-title">{example.brief.title}</h3>
        <p className="workflow-output-intro">
          An illustrative structure for a brief, ready to be checked against the
          original message.
        </p>
        <dl className="workflow-brief-fields">
          {example.brief.fields.map((field) => (
            <div key={field.label}>
              <dt className="eyebrow">{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      </>
    );
  }

  const isReview = stage === "review";
  const content = isReview ? example.review : example.handoff;
  const items = isReview ? example.review.checks : example.handoff.items;

  return (
    <>
      <h3 id="workflow-output-title">{content.title}</h3>
      <p className="workflow-output-intro">
        {isReview
          ? "A person checks the interpretation, resolves uncertainty, and decides what can move forward."
          : "Once the approach is agreed, a clear package can move to the right person or tool."}
      </p>
      <ul className="workflow-output-list">
        {items.map((item, index) => (
          <li key={item}>
            {isReview ? (
              <Check size={16} strokeWidth={1.6} aria-hidden="true" />
            ) : (
              <span className="eyebrow" aria-hidden="true">
                0{index + 1}
              </span>
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="workflow-output-footnote">
        <p className="eyebrow">
          {isReview
            ? "Human judgment required"
            : "An outline, ready to discuss"}
        </p>
        <p>{content.note}</p>
      </div>
    </>
  );
}

export function AIWorkflow({
  onExploreWorkflow,
}: {
  onExploreWorkflow?: (example: WorkflowExample) => void;
}) {
  const [exampleId, setExampleId] =
    useState<WorkflowExample["id"]>("studio-inquiry");
  const [stageId, setStageId] = useState<WorkflowStage>("capture");
  const [selection, setSelection] = useState(0);
  const example =
    workflowExamples.find((item) => item.id === exampleId) ??
    workflowExamples[0];
  const stageIndex = stages.findIndex((item) => item.id === stageId);
  const stage = stages[stageIndex];
  const StageIcon = stage.icon;

  return (
    <section
      id="ai-in-practice"
      className="ai-workflow section-space page-width"
      aria-labelledby="workflow-title"
    >
      <div className="section-heading workflow-heading">
        <div>
          <p className="eyebrow section-label">
            <span>02.1</span> Intelligence in practice
          </p>
          <h2 id="workflow-title">
            From a message.
            <br />
            <em>To a clear next step.</em>
          </h2>
        </div>
        <p>
          The useful side of intelligence. Explore how an everyday request could
          become a structured brief, with a human review before anything moves
          forward.
        </p>
      </div>

      <div className="workflow-console">
        <div className="workflow-console-header">
          <p className="eyebrow workflow-demo-label">
            <span aria-hidden="true" />
            Interactive demonstration
          </p>
          <p className="eyebrow workflow-console-credit">
            Vital / Applied thinking
          </p>
        </div>

        <div
          className="workflow-scenario-selector"
          role="group"
          aria-label="Workflow example"
        >
          {workflowExamples.map((item, index) => (
            <button
              key={item.id}
              className="workflow-scenario-button"
              type="button"
              aria-pressed={exampleId === item.id}
              aria-controls="workflow-source workflow-output"
              onClick={() => {
                if (exampleId === item.id) return;
                setExampleId(item.id);
                setSelection((current) => current + 1);
              }}
            >
              <span className="eyebrow" aria-hidden="true">
                0{index + 1}
              </span>
              <span>{item.name}</span>
              <ArrowDownRight size={16} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="workflow-workspace">
          <div
            className="workflow-stages"
            role="group"
            aria-label="Workflow stage"
          >
            {stages.map((item, index) => (
              <button
                key={item.id}
                className="workflow-stage-button"
                type="button"
                aria-pressed={stageId === item.id}
                aria-controls="workflow-output"
                onClick={() => {
                  if (stageId === item.id) return;
                  setStageId(item.id);
                  setSelection((current) => current + 1);
                }}
              >
                <span
                  className="workflow-stage-index eyebrow"
                  aria-hidden="true"
                >
                  0{index + 1}
                </span>
                <span>{item.name}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            ))}
          </div>

          <div id="workflow-source" className="workflow-source">
            <div className="workflow-source-header">
              <p className="eyebrow">{example.input.source}</p>
              <span className="workflow-source-mark" aria-hidden="true">
                ↗
              </span>
            </div>
            <p className="workflow-source-label">{example.input.label}</p>
            <blockquote className="workflow-source-message">
              “{example.input.message}”
            </blockquote>
            <div
              className="workflow-map-wrap"
              key={selection}
              data-animate={selection > 0}
            >
              <WorkflowMap active={stageIndex} />
            </div>
            <p className="workflow-source-caption">
              <ShieldCheck size={15} aria-hidden="true" />
              AI-assisted structure. Human decisions.
            </p>
          </div>

          <div
            id="workflow-output"
            className="workflow-output"
            role="region"
            aria-labelledby="workflow-output-title"
            data-stage={stageId}
            data-example={exampleId}
          >
            <div className="workflow-output-meta eyebrow">
              <span>
                <StageIcon size={15} aria-hidden="true" />
                {stage.caption}
              </span>
              <span>0{stageIndex + 1} / 04</span>
            </div>
            <WorkflowOutput example={example} stage={stageId} />
          </div>
        </div>

        <div className="workflow-console-footer">
          <p>Illustrative examples. No AI request is sent.</p>
          <span className="eyebrow" aria-hidden="true">
            Source → Structure → Judgment → Handoff
          </span>
        </div>
      </div>

      <div className="workflow-followup">
        <p>
          Start with the work you repeat.
          <br />
          <span>Shape a workflow around the way you work.</span>
        </p>
        <a
          href="#contact"
          className="text-link workflow-inquiry-link"
          onClick={() => onExploreWorkflow?.(example)}
        >
          Discuss a workflow like this{" "}
          <ArrowUpRight size={20} aria-hidden="true" />
        </a>
      </div>
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {example.name}: {stage.name}. {stage.caption}.
      </p>
    </section>
  );
}
