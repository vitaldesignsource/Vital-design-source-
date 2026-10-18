import { useEffect } from "react";

const selector = [
  ".section-heading",
  ".project",
  ".lab-layout",
  ".lab-capability",
  ".services-intro",
  ".service",
  ".studio-heading",
  ".studio-statement",
  ".process-header",
  ".process-strip article",
  ".contact-intro",
  ".contact-form-wrap",
].join(",");

/** Finite, once-only entrances. Server-rendered and unenhanced content is visible. */
export function ScrollChoreography() {
  useEffect(() => {
    const root = document.getElementById("main");
    if (!root || !("IntersectionObserver" in window)) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & {
        connection?: {
          saveData?: boolean;
          addEventListener?: EventTarget["addEventListener"];
          removeEventListener?: EventTarget["removeEventListener"];
        };
      }
    ).connection;
    const tracked = new Set<HTMLElement>();
    let observer: IntersectionObserver | null = null;
    const reveal = (element: HTMLElement) => {
      element.dataset.revealState = "visible";
      observer?.unobserve(element);
    };
    const reset = () => {
      observer?.disconnect();
      observer = null;
      for (const element of tracked) {
        delete element.dataset.revealState;
        delete element.dataset.revealOrder;
        delete element.dataset.revealStyle;
      }
      tracked.clear();
    };
    const configure = () => {
      reset();
      if (preference.matches || connection?.saveData) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) reveal(entry.target as HTMLElement);
          }
        },
        { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
      );
      root.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
        // Never conceal first paint, an anchor destination, or current focus.
        if (
          element.getBoundingClientRect().top < innerHeight ||
          element.contains(document.activeElement)
        )
          return;
        element.dataset.revealState = "pending";
        element.dataset.revealOrder = String(index % 3);
        // Focus can arrive between pointer down and up. Interactive targets
        // fade in without moving their hit area during that gesture.
        if (
          element.querySelector("a,button,input,select,textarea,[tabindex]")
        ) {
          element.dataset.revealStyle = "fade";
        }
        tracked.add(element);
        observer?.observe(element);
      });
    };
    const focus = (event: FocusEvent) => {
      let element = event.target instanceof HTMLElement ? event.target : null;
      while (element && element !== root) {
        if (element.dataset.revealState === "pending") reveal(element);
        element = element.parentElement;
      }
    };
    configure();
    preference.addEventListener("change", configure);
    connection?.addEventListener?.("change", configure);
    root.addEventListener("focusin", focus);
    return () => {
      reset();
      preference.removeEventListener("change", configure);
      connection?.removeEventListener?.("change", configure);
      root.removeEventListener("focusin", focus);
    };
  }, []);
  return null;
}
