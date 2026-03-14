import type { ServiceSchema } from "../services/api";

type ServiceCardProps = {
  service: ServiceSchema;
  onSelect: (service: ServiceSchema) => void;
  description?: string;
};

export default function ServiceCard({ service, onSelect, description }: ServiceCardProps) {
  return (
    <button className="service-card" onClick={() => onSelect(service)}>
      <div className="service-tag">eDistrict Service</div>
      <div className="service-title">{service.service_name}</div>
      {description ? <div className="service-desc">{description}</div> : null}
      <span className="service-action">Open</span>
    </button>
  );
}
