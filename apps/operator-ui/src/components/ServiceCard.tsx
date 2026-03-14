import type { ServiceSchema } from "../services/api";

type ServiceCardProps = {
  service: ServiceSchema;
  onSelect: (service: ServiceSchema) => void;
};

export default function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <button className="service-card" onClick={() => onSelect(service)}>
      <div className="service-tag">eDistrict Service</div>
      <div className="service-title">{service.service_name}</div>
      <div className="service-meta">
        {service.category || "Certificate"} • {service.service_type}
      </div>
      <span className="service-action">Open</span>
    </button>
  );
}
