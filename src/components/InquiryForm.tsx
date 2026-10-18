import { useId, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, LoaderCircle, Asterisk } from "lucide-react";
import { budgets, projectTypes } from "../lib/content";
import { inquirySchema } from "../lib/inquiry";

export function InquiryForm() {
  const formId = useId();
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const statusRef = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);

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
      (
        form.elements.namedItem(
          Object.keys(nextErrors)[0],
        ) as HTMLElement | null
      )?.focus();
      return;
    }
    submitting.current = true;
    setErrors({});
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
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
      form.reset();
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "The connection took too long. Please try again.",
      );
    } finally {
      submitting.current = false;
    }
  }

  const fieldProps = (name: string) => ({
    id: `${formId}-${name}`,
    name,
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? `${formId}-${name}-error` : undefined,
  });
  const errorFor = (name: string) =>
    errors[name] && (
      <span className="field-error" id={`${formId}-${name}-error`}>
        {errors[name]}
      </span>
    );

  return (
    <section
      id="contact"
      className="contact-section section-space page-width"
      aria-labelledby="contact-title"
    >
      <div className="contact-intro">
        <p className="eyebrow section-label">
          <span>04 /</span> Your next chapter
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
          Tell us what’s on your mind. A new direction, a better website,
          something that doesn’t have a name yet. We’re listening.
        </p>
        <p className="eyebrow contact-detail">
          Thoughtful work starts with a conversation.
        </p>
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
                  <select {...fieldProps("type")}>
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
                <textarea
                  {...fieldProps("details")}
                  rows={4}
                  required
                  minLength={20}
                  maxLength={4000}
                  placeholder="The vision, the challenge, the possibilities…"
                />
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
                  <a href="/privacy">privacy notice</a>. *
                </label>
              </div>
              {errorFor("consent")}
              {status === "error" && (
                <p role="alert" className="form-error">
                  {message} Your details have been kept in the form.
                </p>
              )}
              <button
                className="button button-coral submit-button"
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
