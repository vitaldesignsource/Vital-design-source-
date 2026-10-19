import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type Ref,
} from "react";
import { ArrowUpRight, Check, LoaderCircle, Asterisk, X } from "lucide-react";
import { budgets, projectTypes } from "../lib/content";
import {
  detailsWithStartingPoint,
  type CreativeStartingPoint,
  type ProjectType,
} from "../lib/creative-starting-point";
import { inquirySchema, type Inquiry } from "../lib/inquiry";
import { SectionContours } from "./SectionContours";
import "../styles/inquiry-guidance.css";

const combinedMessageError =
  "Your message and starting point together exceed 4,000 characters. Please shorten your message or clear the starting point.";

export interface InquiryFormHandle {
  chooseStartingPoint: (point: CreativeStartingPoint) => void;
}

export function InquiryForm({ ref }: { ref?: Ref<InquiryFormHandle> }) {
  const formId = useId();
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [detailsDraft, setDetailsDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reservedErrors, setReservedErrors] = useState<Record<string, string>>(
    {},
  );
  const [startingPoint, setStartingPoint] =
    useState<CreativeStartingPoint | null>(null);
  const [typeOverride, setTypeOverride] = useState<ProjectType | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const submitting = useRef(false);
  const selectedType =
    typeOverride ?? startingPoint?.projectType ?? projectTypes[0];
  const composedLength = detailsWithStartingPoint(
    detailsDraft.trim(),
    startingPoint,
  ).trim().length;

  useImperativeHandle(
    ref,
    () => ({
      chooseStartingPoint(point) {
        if (submitting.current) return;
        setStartingPoint(point);
        setStatus((current) => (current === "success" ? "idle" : current));
      },
    }),
    [],
  );

  useEffect(() => {
    if (status === "success") statusRef.current?.focus();
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const result = inquirySchema.safeParse({
      ...data,
      consent: data.consent === "on",
    });
    if (!result.success) {
      const nextErrors = Object.fromEntries(
        result.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      );
      setErrors(nextErrors);
      setReservedErrors((current) => ({ ...current, ...nextErrors }));
      (
        form.elements.namedItem(
          Object.keys(nextErrors)[0],
        ) as HTMLElement | null
      )?.focus();
      return;
    }
    // Validate the visitor's own message first, then the exact composed payload.
    // A selected direction cannot satisfy the message minimum on their behalf.
    const payloadResult = inquirySchema.safeParse({
      ...result.data,
      details: detailsWithStartingPoint(result.data.details, startingPoint),
    });
    if (!payloadResult.success) {
      setErrors({
        details: combinedMessageError,
      });
      setReservedErrors((current) => ({
        ...current,
        details: combinedMessageError,
      }));
      (form.elements.namedItem("details") as HTMLElement | null)?.focus();
      return;
    }
    submitting.current = true;
    setErrors({});
    setReservedErrors({});
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadResult.data),
        signal: AbortSignal.timeout(20000),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.ok)
        throw new Error(
          payload.error || "Your inquiry could not be saved. Please try again.",
        );
      setStatus("success");
      setStartingPoint(null);
      setTypeOverride(null);
      setDetailsDraft("");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error &&
          !["TimeoutError", "AbortError", "TypeError"].includes(error.name)
          ? error.message
          : "We couldn’t confirm receipt. Please try again.",
      );
    } finally {
      submitting.current = false;
    }
  }

  function correctFieldOnBlur(
    event: FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const field = event.currentTarget;
    const name = field.name as keyof Inquiry;
    // Only revisit a field already flagged by a submission attempt.
    if (!errors[name]) return;
    const value =
      name === "consent" ? (field as HTMLInputElement).checked : field.value;
    const result = inquirySchema.shape[name].safeParse(value);
    const overCombinedLimit =
      name === "details" &&
      result.success &&
      typeof result.data === "string" &&
      detailsWithStartingPoint(result.data, startingPoint).trim().length > 4000;
    const nextError = !result.success
      ? result.error.issues[0]?.message
      : overCombinedLimit
        ? combinedMessageError
        : undefined;
    if (nextError)
      setReservedErrors((current) => ({ ...current, [name]: nextError }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      if (nextError) next[name] = nextError;
      else delete next[name];
      return next;
    });
  }

  const fieldProps = (name: keyof Inquiry) => ({
    id: `${formId}-${name}`,
    name,
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby":
      [
        ...(name === "details"
          ? [`${formId}-details-hint`, `${formId}-details-capacity`]
          : []),
        ...(errors[name] ? [`${formId}-${name}-error`] : []),
      ].join(" ") || undefined,
    onBlur: correctFieldOnBlur,
  });
  const errorFor = (name: string) =>
    (errors[name] || reservedErrors[name]) && (
      <span className="field-error-slot">
        <span className="field-error-sizer" aria-hidden="true">
          {name === "details" ? combinedMessageError : reservedErrors[name]}
        </span>
        <span
          className={`field-error${errors[name] ? "" : " field-error-reserved"}`}
          id={errors[name] ? `${formId}-${name}-error` : undefined}
          aria-hidden={!errors[name] || undefined}
        >
          {errors[name] || reservedErrors[name]}
        </span>
      </span>
    );

  return (
    <section
      id="contact"
      className="contact-section section-space page-width"
      aria-labelledby="contact-title"
    >
      <SectionContours variant="contact" />
      <div className="contact-intro">
        <p className="eyebrow section-label">
          <span>05 /</span> Your next chapter
        </p>
        <h2 id="contact-title">
          A good idea.
          <br />
          <em>A great place</em>
          <br />
          to start.
          <span className="contact-star" aria-hidden="true">
            <Asterisk aria-hidden="true" strokeWidth={1.3} />
          </span>
        </h2>
        <p>
          A new identity. An immersive website. A visual world you haven’t seen
          before. Tell us what you have in mind.
        </p>
        <p className="eyebrow contact-detail">
          Thoughtful work starts with a conversation.
        </p>
        <div className="inquiry-next-steps">
          <h3>What happens next</h3>
          <ol>
            <li>
              <span className="eyebrow" aria-hidden="true">
                01
              </span>
              <p>We review your idea and the direction you have in mind.</p>
            </li>
            <li>
              <span className="eyebrow" aria-hidden="true">
                02
              </span>
              <p>
                We connect to understand the scope and explore a useful next
                step.
              </p>
            </li>
          </ol>
        </div>
        <div className="inquiry-readiness">
          <h3>A little clarity.</h3>
          <details>
            <summary>
              Do I need a finished brief?
              <span className="inquiry-question-mark" aria-hidden="true" />
            </summary>
            <p>
              A few sentences are a useful start. Tell us your goal, who you
              want to reach, and any timing you have in mind. If the budget is
              still open, choose “Not sure yet.”
            </p>
          </details>
          <details>
            <summary>
              Can I combine services?
              <span className="inquiry-question-mark" aria-hidden="true" />
            </summary>
            <p>
              Choose the closest fit and describe the combination in your
              message. A selected project, service, design direction, or
              workflow is an optional starting point; you can clear it without
              losing your message.
            </p>
          </details>
          <details>
            <summary>
              How are my details used?
              <span className="inquiry-question-mark" aria-hidden="true" />
            </summary>
            <p>
              We use the details you share to review and respond to your
              inquiry. You are not added to a mailing list. Read the{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="privacy notice (opens in a new tab)"
              >
                privacy notice
              </a>{" "}
              for the full details.
            </p>
          </details>
        </div>
      </div>
      <div className="contact-form-wrap">
        {status === "success" ? (
          <div
            className="form-success"
            role="status"
            tabIndex={-1}
            ref={statusRef}
          >
            <span className="success-check">
              <Check size={32} aria-hidden="true" />
            </span>
            <p className="eyebrow">Connection made</p>
            <h3>Message received.</h3>
            <p>
              Thank you for sharing your idea. Your inquiry is safely with the
              studio.
            </p>
            <button
              className="text-link"
              type="button"
              onClick={() => setStatus("idle")}
            >
              Send another inquiry <ArrowUpRight size={18} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            method="post"
            action="/api/inquiry"
            noValidate
          >
            <noscript>
              <p className="form-error">
                Please enable JavaScript to send a project inquiry.
              </p>
            </noscript>
            <p className="eyebrow form-heading">
              Tell us about your project <span>* Required</span>
            </p>
            <fieldset disabled={status === "sending"}>
              <legend className="sr-only">Your project details</legend>
              {startingPoint && (
                <div
                  className="inquiry-starting-point"
                  role="region"
                  aria-labelledby={`${formId}-starting-point-title`}
                >
                  <div className="inquiry-starting-point-heading">
                    <h3
                      className="eyebrow"
                      id={`${formId}-starting-point-title`}
                    >
                      Your starting point
                    </h3>
                    <button
                      type="button"
                      className="inquiry-clear-point"
                      aria-label="Clear starting point"
                      onClick={() => {
                        setStartingPoint(null);
                        const result =
                          inquirySchema.shape.details.safeParse(detailsDraft);
                        const nextError = result.success
                          ? undefined
                          : result.error.issues[0]?.message;
                        if (errors.details && nextError)
                          setReservedErrors((current) => ({
                            ...current,
                            details: nextError,
                          }));
                        setErrors((current) => {
                          if (!current.details) return current;
                          const next = { ...current };
                          if (result.success) delete next.details;
                          else next.details = nextError ?? current.details;
                          return next;
                        });
                        typeRef.current?.focus();
                      }}
                    >
                      Clear <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                  {startingPoint.kind === "project" && (
                    <p className="eyebrow inquiry-point-kind">
                      Project reference
                    </p>
                  )}
                  <p className="inquiry-starting-point-label">
                    {startingPoint.label}
                  </p>
                  <p className="inquiry-starting-point-summary">
                    {startingPoint.summary}
                  </p>
                  <ul
                    className="inquiry-focus-tags"
                    aria-label="Selected focus"
                  >
                    {startingPoint.focus.map((focus) => (
                      <li key={focus}>{focus}</li>
                    ))}
                  </ul>
                  <p className="inquiry-inclusion-note">
                    This selection and its focus will be included with your
                    inquiry. You can still choose any project type below.
                  </p>
                  <p className="sr-only" role="status">
                    {startingPoint.label} selected as your starting point.
                  </p>
                </div>
              )}
              <div className="form-pair">
                <div className="field">
                  <label htmlFor={`${formId}-name`}>Your name *</label>
                  <input
                    {...fieldProps("name")}
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Full name"
                  />
                  {errorFor("name")}
                </div>
                <div className="field">
                  <label htmlFor={`${formId}-email`}>Email address *</label>
                  <input
                    {...fieldProps("email")}
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="you@company.com"
                  />
                  {errorFor("email")}
                </div>
              </div>
              <div className="field">
                <label htmlFor={`${formId}-company`}>Company or project</label>
                <input
                  {...fieldProps("company")}
                  autoComplete="organization"
                  maxLength={120}
                  placeholder="What should we call it? (optional)"
                />
                {errorFor("company")}
              </div>
              <div className="form-pair">
                <div className="field">
                  <label htmlFor={`${formId}-type`}>What do you need?</label>
                  <select
                    {...fieldProps("type")}
                    ref={typeRef}
                    value={selectedType}
                    onChange={(event) =>
                      setTypeOverride(event.currentTarget.value as ProjectType)
                    }
                  >
                    {projectTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  {errorFor("type")}
                </div>
                <div className="field">
                  <label htmlFor={`${formId}-budget`}>Estimated budget</label>
                  <select {...fieldProps("budget")}>
                    {budgets.map((budget) => (
                      <option key={budget}>{budget}</option>
                    ))}
                  </select>
                  {errorFor("budget")}
                </div>
              </div>
              <div className="field">
                <label htmlFor={`${formId}-details`}>
                  A little about your idea *
                </label>
                <p className="inquiry-field-hint" id={`${formId}-details-hint`}>
                  Share your goal, your audience, and any timing you have in
                  mind. Please write at least 20 characters.
                </p>
                <textarea
                  {...fieldProps("details")}
                  onInput={(event) =>
                    setDetailsDraft(event.currentTarget.value)
                  }
                  rows={4}
                  required
                  minLength={20}
                  maxLength={4000}
                  placeholder="The vision, the challenge, the possibilities…"
                />
                <p
                  className="inquiry-message-capacity"
                  id={`${formId}-details-capacity`}
                  data-over-limit={composedLength > 4000 || undefined}
                >
                  <span>
                    {composedLength.toLocaleString("en-US")} / 4,000 characters
                  </span>
                  <span>
                    {startingPoint
                      ? "Includes your selected starting point."
                      : "For your message."}
                  </span>
                </p>
                {errorFor("details")}
              </div>
              <div className="honeypot" aria-hidden="true">
                <label htmlFor={`${formId}-website`}>
                  Leave this field blank
                  <input
                    id={`${formId}-website`}
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
              </div>
              <div className="consent-field">
                <input {...fieldProps("consent")} type="checkbox" required />
                <label htmlFor={`${formId}-consent`}>
                  I agree that my details may be used to respond to this
                  inquiry, as described in the{" "}
                  <span className="consent-privacy">
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="privacy notice (opens in a new tab)"
                    >
                      privacy notice
                    </a>
                    .{"\u00a0"}*
                  </span>
                </label>
              </div>
              {errorFor("consent")}
              {status === "error" && (
                <p role="alert" className="form-error">
                  {message} Your details have been kept in the form.
                </p>
              )}
              <button
                className="button button-primary submit-button"
                type="submit"
                disabled={status === "sending"}
              >
                <span>
                  {status === "sending" ? "Sending inquiry…" : "Send inquiry"}
                </span>
                {status === "sending" ? (
                  <LoaderCircle
                    className="spinner"
                    size={20}
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowUpRight size={20} aria-hidden="true" />
                )}
              </button>
            </fieldset>
            <p role="status" className="sr-only" aria-live="polite">
              {status === "sending" ? "Sending your inquiry. Please wait." : ""}
            </p>
            <p className="form-note">
              Just a conversation. No mailing lists. No pressure.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
