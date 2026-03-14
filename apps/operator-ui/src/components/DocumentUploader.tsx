import { useState } from "react";
import { api } from "../services/api";

type DocumentUploaderProps = {
  applicationId: string | null;
  requiredDocuments?: {
    mandatory?: string[];
    optional?: string[];
  };
  documentLabels?: Record<string, string>;
  onUploaded: (result: { document?: Record<string, unknown> }) => void;
};

export default function DocumentUploader({ applicationId, requiredDocuments, documentLabels, onUploaded }: DocumentUploaderProps) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const handleUpload = async (documentType: string, file?: File) => {
    if (!file || !applicationId) return;
    setUploading((prev) => ({ ...prev, [documentType]: true }));
    try {
      const result = await api.uploadDocument(applicationId, documentType, file);
      onUploaded(result);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setUploading((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  const mandatory = requiredDocuments?.mandatory || [];
  const optional = requiredDocuments?.optional || [];

  return (
    <div className="card csc-section-card">
      <h3 className="csc-section-title">Required Documents</h3>
      <div className="grid csc-doc-list">
        {[...mandatory, ...optional].map((doc) => (
          <div key={doc} className="doc-item">
            <div>
              <strong>{documentLabels?.[doc] || doc.replace(/_/g, " ")}</strong>
              <small className="csc-doc-meta">{mandatory.includes(doc) ? "Mandatory" : "Optional"}</small>
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
