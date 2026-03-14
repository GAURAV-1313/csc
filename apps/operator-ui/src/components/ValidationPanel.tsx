import RiskScoreCard from "./RiskScoreCard";
import type { ValidationResult } from "../services/api";

export default function ValidationPanel({ validationResult }: { validationResult?: ValidationResult | null }) {
  const warnings = validationResult?.warnings || [];
  const missing = validationResult?.missing_documents || [];
  const mismatches = validationResult?.document_verification?.mismatches || [];

  return (
    <div className="card panel">
      <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>AI Review Panel</h3>
      <RiskScoreCard risk={validationResult?.risk} />
      <div style={{ marginTop: "16px" }}>
        <strong>Validation Warnings</strong>
        <ul style={{ marginTop: "10px", paddingLeft: "18px", color: "var(--danger)" }}>
          {warnings.length === 0 && <li style={{ color: "var(--muted)" }}>No warnings detected.</li>}
          {warnings.map((warning, idx) => (
            <li key={`${warning}-${idx}`}>{warning}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: "16px" }}>
        <strong>Missing Documents</strong>
        <ul style={{ marginTop: "10px", paddingLeft: "18px", color: "var(--warning)" }}>
          {missing.length === 0 && <li style={{ color: "var(--muted)" }}>All required documents present.</li>}
          {missing.map((doc, idx) => (
            <li key={`${doc}-${idx}`}>{doc.replace(/_/g, " ")}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: "16px" }}>
        <strong>OCR Mismatches</strong>
        <ul style={{ marginTop: "10px", paddingLeft: "18px", color: "var(--danger)" }}>
          {mismatches.length === 0 && <li style={{ color: "var(--muted)" }}>No OCR mismatches found.</li>}
          {mismatches.map((item, idx) => (
            <li key={`${item.field}-${idx}`}>{item.field.replace(/_/g, " ")}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: "16px" }}>
        <strong>AI Explanation</strong>
        <p style={{ marginTop: "8px", color: "var(--muted)", lineHeight: 1.5 }}>
          {validationResult?.explanation || "Run validation to see AI reasoning."}
        </p>
      </div>
    </div>
  );
}
