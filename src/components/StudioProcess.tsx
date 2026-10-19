import { useId, useState } from "react";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { studioProcess, type StudioPhase } from "../lib/studio-process";

function ProcessDiagram({ phase }: { phase: StudioPhase }) {
  const gradient = `process-light-${useId().replaceAll(":", "")}`;

  return (
    <svg
      className="studio-process-diagram"
      viewBox="0 0 440 350"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={gradient}
          x1="80"
          y1="80"
          x2="360"
          y2="290"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--aurora)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <g className="process-diagram-guide">
        <path d="M24 55V35h20m352 0h20v20M24 295v20h20m352 0h20v-20" />
        <path d="M220 56v238M60 175h320" strokeDasharray="2 8" />
        <circle cx="220" cy="175" r="120" strokeDasharray="2 8" />
      </g>

      {phase === "discover" && (
        <g>
          <g className="process-diagram-secondary">
            <rect
              x="76"
              y="78"
              width="94"
              height="110"
              rx="5"
              transform="rotate(-9 123 133)"
            />
            <path d="m92 105 53-8m-51 24 53-8m-51 25 35-6" />
            <rect
              x="272"
              y="163"
              width="83"
              height="101"
              rx="5"
              transform="rotate(10 313 213)"
            />
            <path d="m286 185 49 9m-52 9 48 9m-51 9 31 5" />
          </g>
          <g className="process-diagram-line" stroke={`url(#${gradient})`}>
            <path d="M141 190c0 53 32 76 79 76s79-23 79-76M221 77v38" />
            <circle cx="220" cy="175" r="56" />
            <path d="m180 214-25 25m105-105 25-25" />
          </g>
          <g className="process-diagram-point">
            <circle cx="220" cy="175" r="5" />
            <circle cx="220" cy="77" r="3" />
            <circle cx="155" cy="239" r="3" />
          </g>
          <text
            x="220"
            y="300"
            className="process-diagram-caption"
            textAnchor="middle"
          >
            PURPOSE / PEOPLE / PRIORITIES
          </text>
        </g>
      )}

      {phase === "design" && (
        <g>
          <g className="process-diagram-secondary">
            <path d="M84 84h271v184H84zM84 126h271M244 126v142" />
            <path d="M104 105h43m-43 143h113m-113-11h76M264 233h69m-69 13h47" />
            <circle cx="338" cy="105" r="3" />
          </g>
          <g className="process-diagram-line" stroke={`url(#${gradient})`}>
            <circle cx="163" cy="181" r="34" />
            <path d="M125 206 165 145l43 61zM264 147h70v56h-70z" />
            <path d="M104 84V63m-10 10h20m220 195v21m-10-10h20" />
          </g>
          <g className="process-diagram-swatch">
            <rect x="264" y="147" width="23" height="56" fill="var(--accent)" />
            <rect x="287" y="147" width="23" height="56" fill="var(--jade)" />
            <rect
              x="310"
              y="147"
              width="24"
              height="56"
              fill="var(--aurora-blue)"
            />
          </g>
          <text
            x="220"
            y="315"
            className="process-diagram-caption"
            textAnchor="middle"
          >
            FORM / FEELING / EXPRESSION
          </text>
        </g>
      )}

      {phase === "develop" && (
        <g>
          <g className="process-diagram-secondary">
            <rect x="78" y="93" width="220" height="151" rx="7" />
            <path d="M78 119h220m-175 149h127m-104-24-9 24m83-24 8 24" />
            <circle cx="93" cy="106" r="2" />
            <circle cx="102" cy="106" r="2" />
            <circle cx="111" cy="106" r="2" />
            <rect x="275" y="162" width="70" height="115" rx="9" />
            <path d="M298 174h24m-22 91h20" />
          </g>
          <g className="process-diagram-line" stroke={`url(#${gradient})`}>
            <path d="m154 153-17 17 17 17m42-34 17 17-17 17m-16-45-13 56M214 219h42v-53h19" />
            <path d="M297 211h26m-26 9h17m-17 9h22M299 133h39V98h-40" />
          </g>
          <g className="process-diagram-point">
            <circle cx="214" cy="219" r="3" />
            <circle cx="338" cy="98" r="4" />
          </g>
          <text
            x="220"
            y="315"
            className="process-diagram-caption"
            textAnchor="middle"
          >
            INTERFACE / CONTENT / SYSTEMS
          </text>
        </g>
      )}

      {phase === "refine" && (
        <g>
          <g className="process-diagram-secondary">
            <circle cx="220" cy="175" r="88" />
            <path d="M120 175H94m226 0h26M220 75V49m0 252v-26m-78-178-12-12m168 12 12-12m-12 168 12 12m-168-12-12 12" />
            <path d="M176 132h88v86h-88z" strokeDasharray="3 6" />
          </g>
          <g className="process-diagram-line" stroke={`url(#${gradient})`}>
            <path d="M220 87a88 88 0 0 1 88 88M220 263a88 88 0 0 1-88-88" />
            <path d="m192 175 18 19 39-39" />
            <path d="M165 132h11v-11m88 0v11h11m0 86h-11v11m-88 0v-11h-11" />
          </g>
          <g className="process-diagram-point">
            <circle cx="220" cy="87" r="4" />
            <circle cx="220" cy="263" r="4" />
          </g>
          <text
            x="220"
            y="315"
            className="process-diagram-caption"
            textAnchor="middle"
          >
            REVIEW / TEST / POLISH
          </text>
        </g>
      )}
    </svg>
  );
}

export function StudioProcess() {
  const [selected, setSelected] = useState<StudioPhase>("discover");
  const [hasSelected, setHasSelected] = useState(false);
  const phase =
    studioProcess.find((item) => item.id === selected) ?? studioProcess[0];
  const index = studioProcess.indexOf(phase);

  return (
    <div className="process-strip studio-process">
      <div
        className="studio-process-selector"
        role="group"
        aria-label="Explore our process"
      >
        {studioProcess.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            className="studio-process-button"
            aria-pressed={selected === item.id}
            aria-controls="studio-process-detail"
            onClick={() => {
              if (selected === item.id) return;
              setSelected(item.id);
              setHasSelected(true);
            }}
          >
            <span className="studio-process-button-meta eyebrow">
              <span>0{itemIndex + 1}</span>
              <ArrowDownRight size={17} aria-hidden="true" />
            </span>
            <span className="studio-process-button-name">{item.name}</span>
            <span className="studio-process-button-cue">{item.cue}</span>
          </button>
        ))}
      </div>

      <div
        id="studio-process-detail"
        className="studio-process-panel"
        role="region"
        aria-labelledby="studio-process-detail-title"
        aria-live="polite"
        aria-atomic="true"
        data-phase={phase.id}
      >
        <div className="studio-process-content">
          <p className="eyebrow studio-process-section-label">
            0{index + 1} / {phase.name}
          </p>
          <h3 id="studio-process-detail-title">{phase.title}</h3>
          <p className="studio-process-objective">{phase.objective}</p>
          <ul className="studio-process-focus">
            {phase.focus.map((point) => (
              <li key={point}>
                <ArrowRight size={14} aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="studio-process-collaboration">
            <p className="eyebrow">Your part in the process</p>
            <p>{phase.collaboration}</p>
          </div>
        </div>

        <div className="studio-process-visual" aria-hidden="true">
          <div className="studio-process-visual-top eyebrow">
            <span>Vital / Method</span>
            <span>0{index + 1} — 04</span>
          </div>
          <div
            className="studio-process-drawing"
            key={phase.id}
            data-animate={hasSelected ? "true" : "false"}
          >
            <ProcessDiagram phase={phase.id} />
          </div>
          <div className="studio-process-visual-bottom">
            <p className="eyebrow">{phase.diagramLabel}</p>
            <p>{phase.artifact}</p>
          </div>
        </div>
      </div>
      <p className="studio-process-note">
        <span className="studio-process-note-mark" aria-hidden="true" />A shared
        conversation, from the first question to the final detail.
      </p>
    </div>
  );
}
