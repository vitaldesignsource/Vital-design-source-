import { ArrowUpRight, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { services } from "../lib/content";
import type { Service } from "../lib/creative-starting-point";
import { serviceScopes } from "../lib/service-scopes";
import { SectionContours } from "./SectionContours";
import "../styles/service-scopes.css";

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
                  aria-label={`0${index + 1} ${service.title}`}
                  aria-describedby={`service-scope-${index}`}
                  aria-expanded={active === index}
                  aria-controls={`service-panel-${index}`}
                  id={`service-button-${index}`}
                  onClick={() => setActive(active === index ? null : index)}
                >
                  <span className="service-index eyebrow" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <span className="service-label">
                    <span className="service-title">{service.title}</span>
                    <span
                      className="service-scope"
                      id={`service-scope-${index}`}
                    >
                      {serviceScopes[service.title].summary}
                    </span>
                  </span>
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
                <div className="service-starting-point">
                  <h4 className="eyebrow">A useful starting point</h4>
                  <p>{serviceScopes[service.title].startingPoint}</p>
                </div>
                <h4 className="eyebrow service-shape-heading">
                  What we shape together
                </h4>
                <ul className="service-details">
                  {service.details.map((detail, detailIndex) => (
                    <li key={detail}>
                      <span className="eyebrow">{detail}</span>
                      <p>{serviceScopes[service.title].details[detailIndex]}</p>
                    </li>
                  ))}
                </ul>
                <div className="service-actions">
                  <a
                    className="text-link service-inquiry-link"
                    href="#contact"
                    onClick={() => onSelectService?.(service)}
                  >
                    Discuss this service
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                  {serviceScopes[service.title].example && (
                    <a
                      className="text-link service-example-link"
                      href={serviceScopes[service.title].example?.href}
                    >
                      {serviceScopes[service.title].example?.label}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
