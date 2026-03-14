import RiskScoreCard from "./RiskScoreCard";
import type { ValidationResult } from "../services/api";

export default function ValidationPanel({ validationResult }: { validationResult?: ValidationResult | null }) {
  const warnings = validationResult?.warnings || [];
  const missing = validationResult?.missing_documents || [];
  const mismatches = validationResult?.document_verification?.mismatches || [];

  return (
    <div className="card panel csc-review-panel">
      <h3 className="csc-section-title">AI Review Panel</h3>
      <RiskScoreCard risk={validationResult?.risk} />
      <div className="csc-panel-group">
        <strong className="csc-panel-title">Validation Warnings</strong>
        <ul className="csc-panel-list csc-list-danger">
          {warnings.length === 0 && <li className="csc-list-empty">No warnings detected.</li>}
          {warnings.map((warning, idx) => (
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
