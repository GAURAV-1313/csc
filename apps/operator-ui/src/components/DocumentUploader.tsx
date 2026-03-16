import { useState } from "react";
import { api } from "../services/api";

type DocumentUploaderProps = {
  applicationId: string | null;
  requiredDocuments?: {
    mandatory?: string[];
    optional?: string[];
    accepted_groups?: Record<string, string[]>;
  };
  documentLabels?: Record<string, string>;
  uploadedDocs?: Array<Record<string, unknown>>;
  onUploaded: (result: { document?: Record<string, unknown>; ai_document_analysis?: Record<string, unknown> }) => void;
};

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Upload failed";
}

export default function DocumentUploader({ applicationId, requiredDocuments, documentLabels, uploadedDocs = [], onUploaded }: DocumentUploaderProps) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const handleUpload = async (documentType: string, file?: File) => {
    if (!file || !applicationId) return;
    setUploading((prev) => ({ ...prev, [documentType]: true }));
    try {
      const result = await api.uploadDocument(applicationId, documentType, file);
      onUploaded(result);
    } catch (error) {
      console.error(error);
      alert(toErrorMessage(error));
    } finally {
      setUploading((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  const mandatory = requiredDocuments?.mandatory || [];
  const optional = requiredDocuments?.optional || [];
  const acceptedGroups = requiredDocuments?.accepted_groups || {};

  const latestAnalysisByType = uploadedDocs.reduce<Record<string, Record<string, unknown>>>((acc, doc) => {
    const type = String(doc.document_type || doc.documentType || "");
    const analysis = doc.ai_document_analysis;
    if (type && analysis && typeof analysis === "object") {
      acc[type] = analysis as Record<string, unknown>;
    }
    return acc;
  }, {});

  return (
    <div className="card csc-section-card" id="csc-docs">
      <h3 className="csc-section-title">Required Documents</h3>
      <div className="grid csc-doc-list">
        {[...mandatory, ...optional].map((doc) => (
          <div key={doc} className="doc-item">
            <div>
              <strong>{documentLabels?.[doc] || doc.replace(/_/g, " ")}</strong>
              <small className="csc-doc-meta">{mandatory.includes(doc) ? "Mandatory" : "Optional"}</small>
              {Array.isArray(acceptedGroups[doc]) && acceptedGroups[doc].length > 0 && (
                <small className="csc-doc-meta">
                  Accepted: {acceptedGroups[doc].map((item) => item.replace(/_/g, " ")).join(", ")}
                </small>
              )}
              {latestAnalysisByType[doc] && (() => {
                const analysis = latestAnalysisByType[doc];
                const issues = Array.isArray(analysis.issues) ? analysis.issues.map(String) : [];
                const hasAiFailure = issues.some((issue) => /manual review required|could not be parsed|analysis unavailable|request failed/i.test(issue));
                const isReview = hasAiFailure || analysis.is_match === false || analysis.format_ok === false;
                const confidence = typeof analysis.confidence === "number"
                  ? Math.round(Number(analysis.confidence) * 100)
                  : null;
                return (
                  <>
                    <small className="csc-doc-meta" style={{ marginTop: "6px" }}>
                      <span className={`csc-ai-chip ${isReview ? "warn" : "ok"}`}>
                        {isReview ? "AI: Review" : "AI: OK"}
                      </span>
                      {confidence !== null ? ` ${confidence}%` : ""}
                    </small>
                    {issues.length > 0 && (
                      <small className="csc-doc-meta">Why: {issues[0]}</small>
                    )}
                  </>
                );
              })()}
            </div>
            <input
              className="csc-file-input"
              type="file"
              onChange={(event) => handleUpload(doc, event.target.files?.[0])}
              disabled={uploading[doc]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
