import FieldRenderer from "./FieldRenderer";
import type { ServiceSchema } from "../services/api";

type DynamicFormProps = {
  schema: ServiceSchema | null;
  formData: Record<string, string | number | boolean>;
  onChange: (key: string, value: string | number | boolean) => void;
};

export default function DynamicForm({ schema, formData, onChange }: DynamicFormProps) {
  if (!schema) return null;

  return (
    <div className="grid" style={{ gap: "24px" }}>
      {(schema.sections || []).map((section) => (
        <div key={section.name} className="card">
          <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>{section.name}</h3>
          {(section.fields || []).map((field) => (
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
  );
}
