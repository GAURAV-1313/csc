import type { ServiceSchema } from "../services/api";

type ServiceCardProps = {
  service: ServiceSchema;
  onSelect: (service: ServiceSchema) => void;
  description?: string;
};

export default function ServiceCard({ service, onSelect, description }: ServiceCardProps) {
  const category = String(service.category || "Certificate")
    .replace(/services?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return (
    <button className="service-card" onClick={() => onSelect(service)}>
      <div className="service-tag">eDistrict</div>
      <div className="service-title">{service.service_name}</div>
      {description ? <div className="service-desc">{description}</div> : null}
      <div className="service-meta">
        {" "}
      </div>
      <span className="service-action">Open</span>
    </button>
  );
}
