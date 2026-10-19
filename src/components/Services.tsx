import { ArrowUpRight, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { services } from "../lib/content";
import type { Service } from "../lib/creative-starting-point";
import { SectionContours } from "./SectionContours";

export function Services({
  onSelectService,
}: {
  onSelectService?: (service: Service) => void;
}) {
  const [active, setActive] = useState<number | null>(0);
  return (
    <section
      id="services"
      className="services-section section-space"
      aria-labelledby="services-title"
    >
      <SectionContours variant="services" />
      <div className="page-width services-layout">
        <div className="services-intro">
          <p className="eyebrow section-label">
            <span>03 /</span> Our capabilities
          </p>
          <h2 id="services-title">
            Human vision.
            <br />
            <em>New possibilities.</em>
          </h2>
          <p className="services-description">
            Websites, identities, campaign imagery, and motion. We connect
            considered design and engineering with AI-assisted exploration,
            guided by a human creative point of view.
          </p>
          <a className="text-link" href="#contact">
            Let’s find your starting point{" "}
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
        <div className="service-list">
          {services.map((service, index) => (
            <article
              className={active === index ? "service expanded" : "service"}
              key={service.title}
            >
              <h3>
                <button
                  type="button"
                  aria-expanded={active === index}
                  aria-controls={`service-panel-${index}`}
                  id={`service-button-${index}`}
                  onClick={() => setActive(active === index ? null : index)}
                >
                  <span className="service-index eyebrow">0{index + 1}</span>
                  <span className="service-title">{service.title}</span>
                  {active === index ? (
                    <Minus className="service-toggle" aria-hidden="true" />
                  ) : (
                    <Plus className="service-toggle" aria-hidden="true" />
                  )}
                </button>
              </h3>
              <div
                id={`service-panel-${index}`}
                aria-labelledby={`service-button-${index}`}
                className="service-panel"
                role="region"
                hidden={active !== index}
              >
                <p className="service-short">{service.short}</p>
                <p>{service.description}</p>
                <ul className="service-details">
                  {service.details.map((detail) => (
                    <li className="eyebrow" key={detail}>
                      {detail}
                    </li>
                  ))}
                </ul>
                <a
                  className="text-link service-inquiry-link"
                  href="#contact"
                  onClick={() => onSelectService?.(service)}
                >
                  Discuss this service
                  <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
