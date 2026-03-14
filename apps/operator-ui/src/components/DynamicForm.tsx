import FieldRenderer from "./FieldRenderer";
import type { ServiceSchema } from "../services/api";

type DynamicFormProps = {
  schema: ServiceSchema | null;
  formData: Record<string, string | number | boolean>;
  onChange: (key: string, value: string | number | boolean) => void;
};

export default function DynamicForm({ schema, formData, onChange }: DynamicFormProps) {
  if (!schema) return null;

  const groupLabels: Record<string, string> = {
    beneficiary: "Beneficiary Details",
    guardian: "Guardian Details",
    applicant: "Applicant Details",
    address: "Address Details",
    income: "Income Details",
    residence: "Residence Details",
    education: "Education Details",
    business: "Business Details",
    declaration: "Declaration",
    document: "Document Details"
  };

  function getGroupKey(fieldKey: string) {
    const lower = fieldKey.toLowerCase();
    if (lower.startsWith("beneficiary_")) return "beneficiary";
    if (lower.startsWith("guardian_")) return "guardian";
    if (lower.startsWith("applicant_")) return "applicant";
    if (lower.includes("address")) return "address";
    if (lower.includes("income")) return "income";
    if (lower.includes("residence") || lower.includes("stay")) return "residence";
    if (lower.includes("education")) return "education";
    if (lower.includes("business") || lower.includes("service_details")) return "business";
    if (lower.includes("declaration") || lower === "signature" || lower === "date" || lower === "place")
      return "declaration";
    if (lower.includes("document")) return "document";
    return "other";
  }

  function groupFields(
    fields: Array<{ key: string; type: string; required?: boolean; options?: string[] }>
  ) {
    const groups: Record<string, typeof fields> = {};
    fields.forEach((field) => {
      const key = getGroupKey(field.key);
      if (!groups[key]) groups[key] = [];
      groups[key].push(field);
    });
    return groups;
  }

  return (
    <div className="grid csc-form-grid">
      {(schema.sections || []).map((section) => (
        <div key={section.name} className="card csc-section-card">
          <h3 className="csc-section-title">{section.name}</h3>
          {Object.entries(groupFields(section.fields || []))
            .sort(([a], [b]) => (a === "other" ? 1 : b === "other" ? -1 : a.localeCompare(b)))
            .map(([groupKey, fields]) => (
              <div key={`${section.name}-${groupKey}`} className="csc-subsection">
                <h4 className="csc-subsection-title">{groupLabels[groupKey] || "Other Details"}</h4>
                {fields.map((field) => (
                  <div className="form-row" key={`${section.name}-${field.key}`}>
                    <label>
                      {field.key.replace(/_/g, " ")}
                      {field.required ? " *" : ""}
                    </label>
                    <FieldRenderer field={field} value={formData[field.key]} onChange={onChange} />
                  </div>
                ))}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
