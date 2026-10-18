import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

export function Brand() {
  return (
    <a href="/#top" className="brand" aria-label="Vital Design Source home">
      <img
        src="/assets/brand/vital-logo-light.png"
        width="64"
        height="62"
        alt=""
      />
      <span>
        VITAL<span>DESIGN SOURCE</span>
      </span>
    </a>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const links = [
    ["Work", "work"],
    ["Services", "services"],
    ["Studio", "studio"],
  ] as const;
  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    const toggle = trigger.current;
    modal?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const query = window.matchMedia("(min-width: 800px)");
    const onResize = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", onResize);
    return () => {
      modal?.close();
      document.body.style.overflow = previous;
      query.removeEventListener("change", onResize);
      toggle?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <header className="site-header page-width">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, id]) => (
            <a key={id} href={`/#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <a className="nav-contact" href="/#contact">
          Let’s talk <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <button
          ref={trigger}
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
        >
          <span>Menu</span>
          <Menu size={22} aria-hidden="true" />
        </button>
      </header>
      <dialog
        ref={dialog}
        id="mobile-menu"
        className="mobile-menu"
        aria-label="Mobile navigation"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <div className="mobile-menu-top">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Mobile">
          {[...links, ["Start a project", "contact"]].map(
            ([label, id], index) => (
              <a key={id} href={`/#${id}`} onClick={() => setOpen(false)}>
                <span className="eyebrow">0{index + 1}</span>
                {label}
                <ArrowUpRight aria-hidden="true" />
              </a>
            ),
          )}
        </nav>
        <p className="eyebrow">Independent thinking. Connected craft.</p>
      </dialog>
    </>
  );
}
