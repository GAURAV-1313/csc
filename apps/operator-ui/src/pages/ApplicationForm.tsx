import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type ServiceSchema, type ValidationResult } from "../services/api";
import DynamicForm from "../components/DynamicForm";
import DocumentUploader from "../components/DocumentUploader";
import ValidationPanel from "../components/ValidationPanel";

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
