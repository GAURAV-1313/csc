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

  function buildFieldConditions(field: { key: string; type: string; required?: boolean; options?: string[]; maxLength?: number; min?: number; max?: number; min_length?: number; max_length?: number; pattern?: string }) {
    const conditions: string[] = [];
    const key = String(field.key || "").toLowerCase();

    if (field.required) conditions.push("Required");

    if (field.type === "number") conditions.push("Must be a number");
    if (field.type === "date") conditions.push("Must be a valid date");
    if (field.type === "boolean") conditions.push("Yes/No selection");

    if (field.min !== undefined) conditions.push(`Min ${field.min}`);
    if (field.max !== undefined) conditions.push(`Max ${field.max}`);
    if (field.min_length !== undefined) conditions.push(`Min length ${field.min_length}`);
    if (field.max_length !== undefined) conditions.push(`Max length ${field.max_length}`);
    if (field.maxLength !== undefined) conditions.push(`Max length ${field.maxLength}`);
    if (field.pattern) conditions.push("Must match required format");

    if (Array.isArray(field.options) && field.options.length > 0) {
      conditions.push(`Select one of: ${field.options.join(", ")}`);
    }

    if (key.includes("pin_code") || key.includes("pincode")) conditions.push("6-digit PIN");
    if (key.includes("aadhaar") || key.includes("aadhar")) conditions.push("12-digit Aadhaar");
    if (key.includes("pan")) conditions.push("PAN format: ABCDE1234F");
    if (key.includes("email")) conditions.push("Valid email address");
    if (key.includes("mobile") || key.includes("phone")) conditions.push("10-digit mobile");
    if (key.includes("ifsc")) conditions.push("IFSC format: SBIN0000001");
    if (key.includes("account")) conditions.push("9-18 digit account number");
    if (key.includes("date_of_birth") || key.includes("dob")) conditions.push("DOB cannot be in the future");
    if (key.includes("expiry")) conditions.push("Expiry date must be in the future");
    if (key.includes("issue")) conditions.push("Issue date cannot be in the future");
    if (key.includes("age")) conditions.push("Age between 0 and 120");
    if (key.includes("income")) conditions.push("Income must be positive");

    return conditions;
  }

  function validateField(
    field: { key: string; type: string; required?: boolean; options?: string[]; maxLength?: number; min?: number; max?: number; min_length?: number; max_length?: number; pattern?: string },
    rawValue: string | number | boolean | undefined
  ) {
    const key = String(field.key || "").toLowerCase();
    const value = rawValue ?? "";
    const valueStr = String(value).trim();

    if (field.required && valueStr === "") return "Required field";
    if (!field.required && valueStr === "") return null;

    if (field.type === "number") {
      if (Number.isNaN(Number(valueStr))) return "Must be a number";
      const num = Number(valueStr);
      if (field.min !== undefined && num < Number(field.min)) return `Min ${field.min}`;
      if (field.max !== undefined && num > Number(field.max)) return `Max ${field.max}`;
      if (key.includes("age") && (num < 0 || num > 120)) return "Age must be between 0 and 120";
      if (key.includes("income") && num < 0) return "Income must be positive";
    }

    if (field.type === "date") {
      if (Number.isNaN(Date.parse(valueStr))) return "Invalid date";
      const parsed = Date.parse(valueStr);
      if ((key.includes("date_of_birth") || key.includes("dob")) && parsed > Date.now()) {
        return "DOB cannot be in the future";
      }
      if (key.includes("issue") && parsed > Date.now()) return "Issue date cannot be in the future";
      if (key.includes("expiry") && parsed < Date.now()) return "Expiry date must be in the future";
    }

    if (field.type === "boolean") {
      if (!(value === true || value === false)) return "Select Yes/No";
    }

    if (field.type === "string" || field.type === "textarea" || field.type === "select") {
      if (field.min_length !== undefined && valueStr.length < Number(field.min_length)) return `Min length ${field.min_length}`;
      if (field.max_length !== undefined && valueStr.length > Number(field.max_length)) return `Max length ${field.max_length}`;
      if (field.maxLength !== undefined && valueStr.length > Number(field.maxLength)) return `Max length ${field.maxLength}`;
    }

    if (Array.isArray(field.options) && field.options.length > 0) {
      if (!field.options.includes(valueStr)) return "Select a valid option";
    }

    if (field.pattern) {
      try {
        const regex = new RegExp(field.pattern);
        if (!regex.test(valueStr)) return "Invalid format";
      } catch {
        // ignore invalid pattern
      }
    }

    if (key.includes("pin_code") || key.includes("pincode")) {
      if (!/^\d{6}$/.test(valueStr)) return "PIN must be 6 digits";
    }
    if (key.includes("aadhaar") || key.includes("aadhar")) {
      if (!/^\d{12}$/.test(valueStr)) return "Aadhaar must be 12 digits";
    }
    if (key.includes("pan")) {
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(valueStr.toUpperCase())) return "PAN format: ABCDE1234F";
    }
    if (key.includes("email")) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valueStr)) return "Invalid email address";
    }
    if (key.includes("mobile") || key.includes("phone")) {
      if (!/^\d{10}$/.test(valueStr)) return "Mobile must be 10 digits";
    }
    if (key.includes("ifsc")) {
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(valueStr.toUpperCase())) return "Invalid IFSC";
    }
    if (key.includes("account")) {
      if (!/^\d{9,18}$/.test(valueStr)) return "Account must be 9-18 digits";
    }
    if (key.includes("name") && valueStr.length < 2) return "Name too short";

    return null;
  }

  return (
    <div className="grid csc-form-grid">
      {(schema.sections || []).map((section) => (
        <div key={section.name} className="card csc-section-card">
          <div className="csc-section-header">
            <h3 className="csc-section-title">{section.name}</h3>
          </div>
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
                    {(() => {
                      const error = validateField(field, formData[field.key]);
                      return (
                        <>
                          <FieldRenderer field={field} value={formData[field.key]} onChange={onChange} error={error} />
                          {error && <div className="field-error">{error}</div>}
                        </>
                      );
                    })()}
                    {buildFieldConditions(field).length > 0 && (
                      <div className="field-hints">
                        {buildFieldConditions(field).map((hint) => (
                          <span key={`${field.key}-${hint}`} className="field-hint">
                            {hint}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
