import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type ServiceSchema, type ValidationResult, type CitizenReport } from "../services/api";
import DynamicForm from "../components/DynamicForm";
import DocumentUploader from "../components/DocumentUploader";
import ValidationPanel from "../components/ValidationPanel";

/** Best-effort mapping from bot citizen_data keys to CSC form field keys. */
const CITIZEN_DATA_FIELD_MAP: Record<string, string> = {
  full_name: "applicant_name",
  dob: "date_of_birth",
  mobile: "mobile_number",
  email: "email",
  address: "address",
  gender: "gender",
  aadhaar_number: "aadhaar_number",
  pan_number: "pan_number",
  father_name: "father_name",
  mother_name: "mother_name",
  district: "district"
};

/** Map bot citizen_data onto CSC form field keys (best-effort). */
function mapCitizenDataToForm(
  citizenData: Record<string, string | null>,
  schema: ServiceSchema | null
): Record<string, string> {
  const mapped: Record<string, string> = {};
  const schemaKeys = new Set(
    (schema?.sections || []).flatMap((s) => s.fields.map((f) => f.key))
  );

  for (const [botKey, value] of Object.entries(citizenData)) {
    if (value === null || value === undefined) continue;
    const val = String(value);

    // Direct match — bot key is the same as a schema field key
    if (schemaKeys.has(botKey)) {
      mapped[botKey] = val;
      continue;
    }
    // Mapped match
    const cscKey = CITIZEN_DATA_FIELD_MAP[botKey];
    if (cscKey && schemaKeys.has(cscKey)) {
      mapped[cscKey] = val;
    }
  }
  return mapped;
}

export default function ApplicationForm() {
  const { serviceType } = useParams<{ serviceType: string }>();
  const navigate = useNavigate();
  const [schema, setSchema] = useState<ServiceSchema | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({});
  const [uploadedDocs, setUploadedDocs] = useState<Array<Record<string, unknown>>>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  // WhatsApp pre-check lookup state
  const [referenceId, setReferenceId] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [citizenReport, setCitizenReport] = useState<CitizenReport | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        if (!serviceType) return;
        const service = await api.getServiceSchema(serviceType);
        if (!mounted) return;
        setSchema(service.service);

        const draft = await api.createApplicationDraft({ serviceType, citizenData: {} });
        if (!mounted) return;
        setApplicationId(draft.application_id);
      } catch (error) {
        console.error(error);
        alert(error.message);
      } finally {
        mounted && setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [serviceType]);

  const handleChange = (key: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const requiredDocuments = useMemo(() => schema?.required_documents, [schema]);

  const handleUploaded = (result: { document?: Record<string, unknown> }) => {
    if (!result?.document) return;
    setUploadedDocs((prev) => [...prev, result.document]);
  };

  /** Lookup citizen report from the bot and pre-fill form */
  const handleWhatsappLookup = async () => {
    const id = referenceId.trim().toUpperCase();
    if (!id) return;
    setLookingUp(true);
    setLookupError(null);
    setCitizenReport(null);
    try {
      const report = await api.getWhatsappReport(id);
      setCitizenReport(report);
      // Pre-fill form with citizen data
      const mapped = mapCitizenDataToForm(report.citizen_data || {}, schema);
      setFormData((prev) => ({ ...prev, ...mapped }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lookup failed";
      setLookupError(message);
    } finally {
      setLookingUp(false);
    }
  };

  const validateApplication = async () => {
    if (!schema || !serviceType) return;
    setValidating(true);
    try {
      const payload = {
        serviceType,
        citizenData: formData,
        documents: uploadedDocs.map((doc) => ({
          documentType: (doc.document_type as string) || (doc.documentType as string),
          filePath: (doc.file_path as string) || (doc.filePath as string)
        })),
        application_id: applicationId
      };
      const result = await api.validateApplication(payload);
      setValidationResult(result);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setValidating(false);
    }
  };

  const submitApplication = async () => {
    if (!applicationId) return;
    try {
      await api.submitApplication(applicationId);
      window.location.href = "https://edistrict.cgstate.gov.in";
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="page">
      <div className="shell">
        <div className="header">
          <div>
            <h1 className="title">{schema?.service_name || "Service Application"}</h1>
            <p className="subtitle">Application ID: {applicationId || "..."}</p>
          </div>
          <button className="btn secondary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>

        {/* WhatsApp Pre-check Lookup */}
        <div className="card" style={{ marginBottom: "24px", borderLeft: "4px solid #25D366" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📱</span> WhatsApp Pre-check Lookup
          </h3>
          <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--muted)" }}>
            Enter the citizen's Reference ID (e.g.&nbsp;<strong>PC-0VLTMA</strong>) to auto-fill the form.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="PC-XXXXXX"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleWhatsappLookup()}
              style={{
                flex: "1",
                minWidth: "160px",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontFamily: "monospace",
                fontSize: "14px"
              }}
            />
            <button
              className="btn"
              onClick={handleWhatsappLookup}
              disabled={lookingUp || !referenceId.trim()}
              style={{ background: "#25D366", border: "none" }}
            >
              {lookingUp ? "Looking up…" : "Fetch & Pre-fill"}
            </button>
          </div>

          {lookupError && (
            <p style={{ margin: "10px 0 0", color: "#dc2626", fontSize: "13px" }}>
              ❌ {lookupError}
            </p>
          )}

          {citizenReport && (
            <div style={{ marginTop: "12px", fontSize: "13px" }}>
              <p style={{ margin: "0 0 6px", color: "#16a34a" }}>
                ✅ Pre-check data loaded for <strong>{citizenReport.reference_id}</strong>
                {" — "}{citizenReport.service_type?.replace(/_/g, " ")}
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {citizenReport.pdf_url && (
                  <a href={citizenReport.pdf_url} target="_blank" rel="noreferrer" className="btn secondary" style={{ fontSize: "12px", padding: "4px 10px" }}>
                    📄 Download PDF
                  </a>
                )}
                {citizenReport.view_url && (
                  <a href={citizenReport.view_url} target="_blank" rel="noreferrer" className="btn secondary" style={{ fontSize: "12px", padding: "4px 10px" }}>
                    🔍 View Report
                  </a>
                )}
              </div>
              {citizenReport.documents && citizenReport.documents.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <strong>Documents:</strong>{" "}
                  {citizenReport.documents.map((d) => (
                    <span
                      key={d.type}
                      style={{
                        display: "inline-block",
                        margin: "2px",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        background: d.status === "available" ? "#dcfce7" : "#fee2e2",
                        color: d.status === "available" ? "#166534" : "#991b1b"
                      }}
                    >
                      {d.label} {d.status === "available" ? "✓" : "✗"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="card">Loading schema...</div>
        ) : (
          <div className="layout">
            <div className="grid" style={{ gap: "24px" }}>
              <DynamicForm schema={schema} formData={formData} onChange={handleChange} />
              <DocumentUploader
                applicationId={applicationId}
                requiredDocuments={requiredDocuments}
                onUploaded={handleUploaded}
              />
              <div className="card" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button className="btn" onClick={validateApplication} disabled={validating}>
                  {validating ? "Validating..." : "Validate Application"}
                </button>
                <button className="btn secondary" onClick={submitApplication}>
                  Submit to eDistrict
                </button>
              </div>
            </div>
            <ValidationPanel validationResult={validationResult} />
          </div>
        )}
      </div>
    </div>
  );
}
