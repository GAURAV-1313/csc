import RiskScoreCard from "./RiskScoreCard";
import type { ValidationResult, ServiceSchema } from "../services/api";

type ValidationPanelProps = {
  validationResult?: ValidationResult | null;
  schema?: ServiceSchema | null;
  formData?: Record<string, string | number | boolean>;
};

function computeMissingFields(schema?: ServiceSchema | null, formData?: Record<string, string | number | boolean>) {
  if (!schema || !schema.sections) return [];
  const missing: string[] = [];
  schema.sections.forEach((section) => {
    (section.fields || []).forEach((field) => {
      const value = formData ? formData[field.key] : undefined;
      if (value === undefined || value === null || String(value).trim() === "") {
        missing.push(field.key);
      }
    });
  });
  return missing;
}

export default function ValidationPanel({ validationResult, schema, formData }: ValidationPanelProps) {
  const warnings = validationResult?.warnings || [];
  const missing = validationResult?.missing_documents || [];
  const mismatches = validationResult?.document_verification?.mismatches || [];
  const backendMissingFields = warnings
    .filter((warning) => warning.toLowerCase().startsWith("missing required field:"))
    .map((warning) => warning.split(":").slice(1).join(":").trim());
  const frontendMissingFields = computeMissingFields(schema, formData);
  const missingFields = backendMissingFields.length > 0 ? backendMissingFields : frontendMissingFields;
  const otherWarnings = warnings.filter(
    (warning) => !warning.toLowerCase().startsWith("missing required field:")
  );

  return (
    <div className="card panel csc-review-panel">
      <h3 className="csc-section-title">AI Review Panel</h3>
      <RiskScoreCard risk={validationResult?.risk} />
      <div className="csc-panel-group">
        <strong className="csc-panel-title">Missing Fields</strong>
        <ul className="csc-panel-list csc-list-warning">
          {missingFields.length === 0 && <li className="csc-list-empty">All required fields present.</li>}
          {missingFields.map((field, idx) => (
            <li key={`${field}-${idx}`}>{field.replace(/_/g, " ")}</li>
          ))}
        </ul>
      </div>
      <div className="csc-panel-group">
        <strong className="csc-panel-title">Validation Warnings</strong>
        <ul className="csc-panel-list csc-list-danger">
          {otherWarnings.length === 0 && <li className="csc-list-empty">No warnings detected.</li>}
          {otherWarnings.map((warning, idx) => (
            <li key={`${warning}-${idx}`}>{warning}</li>
          ))}
        </ul>
      </div>
      <div className="csc-panel-group">
        <strong className="csc-panel-title">Missing Documents</strong>
        <ul className="csc-panel-list csc-list-warning">
          {missing.length === 0 && <li className="csc-list-empty">All required documents present.</li>}
          {missing.map((doc, idx) => (
            <li key={`${doc}-${idx}`}>{doc.replace(/_/g, " ")}</li>
          ))}
        </ul>
      </div>
      <div className="csc-panel-group">
        <strong className="csc-panel-title">OCR Mismatches</strong>
        <ul className="csc-panel-list csc-list-danger">
          {mismatches.length === 0 && <li className="csc-list-empty">No OCR mismatches found.</li>}
          {mismatches.map((item, idx) => (
            <li key={`${item.field}-${idx}`}>{item.field.replace(/_/g, " ")}</li>
          ))}
        </ul>
      </div>
      <div className="csc-panel-group">
        <strong className="csc-panel-title">AI Explanation</strong>
        <p className="csc-panel-explanation">
          {validationResult?.explanation || "Run validation to see AI reasoning."}
        </p>
      </div>
    </div>
  );
}
