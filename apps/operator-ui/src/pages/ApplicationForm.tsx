import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type ServiceSchema, type ValidationResult } from "../services/api";
import DynamicForm from "../components/DynamicForm";
import DocumentUploader from "../components/DocumentUploader";
import ValidationPanel from "../components/ValidationPanel";

const incomeCertificateSchema: ServiceSchema = {
  service_id: "income_certificate",
  service_name: "Income Certificate",
  service_type: "income_certificate",
  sections: [
    {
      name: "Beneficiary Details",
      fields: [
        { key: "gender", type: "text", required: true },
        { key: "age_of_beneficiary", type: "number", required: true },
        { key: "beneficiary_guardian_type", type: "text", required: true },
        { key: "beneficiary_guardian_name", type: "text", required: true },
        { key: "relation_with_applicant", type: "text", required: true },
        { key: "beneficiary_relative_name", type: "text", required: true },
        { key: "caste", type: "text", required: true },
        { key: "type", type: "text", required: true },
        { key: "class_number", type: "text", required: true }
      ]
    },
    {
      name: "Address Details",
      fields: [
        { key: "address", type: "textarea", required: true },
        { key: "pin_code", type: "text", required: true },
        { key: "district", type: "text", required: true }
      ]
    },
    {
      name: "Income Details",
      fields: [
        { key: "business_or_service_details", type: "textarea", required: true },
        { key: "reason_for_application", type: "textarea", required: true },
        { key: "annual_income", type: "number", required: true },
        { key: "average_income_last_3_years", type: "number", required: true }
      ]
    },
    {
      name: "Declaration",
      fields: [
        { key: "date", type: "date", required: true },
        { key: "place", type: "text", required: true },
        { key: "applicant_name", type: "text", required: true }
      ]
    }
  ],
  required_documents: {
    mandatory: ["affidavit", "income_proof", "signature"],
    optional: []
  }
};

const domicileCertificateSchema: ServiceSchema = {
  service_id: "domicile_certificate",
  service_name: "Domicile Certificate",
  service_type: "domicile_certificate",
  sections: [
    {
      name: "General Details",
      fields: [
        { key: "beneficiary_guardian_type", type: "text", required: true },
        { key: "beneficiary_guardian_name", type: "text", required: true },
        { key: "guardian_occupation", type: "text", required: true },
        { key: "place_of_birth", type: "text", required: true },
        { key: "gender", type: "text", required: true },
        { key: "date_of_birth", type: "date", required: true }
      ]
    },
    {
      name: "Address Details",
      fields: [
        { key: "address", type: "textarea", required: true },
        { key: "pin_code", type: "text", required: true },
        { key: "district", type: "text", required: true }
      ]
    },
    {
      name: "Residence Details",
      fields: [{ key: "particulars_of_stay_after_birth", type: "textarea", required: true }]
    },
    {
      name: "Business Details",
      fields: [{ key: "beneficiary_business_or_service_details", type: "textarea", required: true }]
    },
    {
      name: "Education Details",
      fields: [{ key: "beneficiary_education_level", type: "text", required: true }]
    },
    {
      name: "Other Details",
      fields: [
        { key: "voter_id_available", type: "boolean", required: true },
        { key: "district_name_of_beneficiary", type: "text", required: true },
        { key: "living_in_state_years", type: "number", required: true },
        { key: "reason_for_domicile_application", type: "textarea", required: true },
        { key: "other_details", type: "textarea", required: true }
      ]
    },
    {
      name: "Declaration",
      fields: [
        { key: "date", type: "date", required: true },
        { key: "signature", type: "text", required: true }
      ]
    }
  ],
  required_documents: {
    mandatory: ["affidavit", "proof_of_15_years_residence", "educational_certificate"],
    optional: []
  }
};

export default function ApplicationForm() {
  const { serviceType } = useParams<{ serviceType: string }>();
  const isIncomeCertificate = serviceType === "income_certificate";
  const isDomicileCertificate = serviceType === "domicile_certificate";
  const isCustomCertificate = isIncomeCertificate || isDomicileCertificate;
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
        setSchema(
          isIncomeCertificate
            ? {
                ...incomeCertificateSchema,
                service_name: service.service?.service_name || incomeCertificateSchema.service_name
              }
            : isDomicileCertificate
              ? {
                  ...domicileCertificateSchema,
                  service_name: service.service?.service_name || domicileCertificateSchema.service_name
                }
              : service.service
        );

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
  }, [serviceType, isIncomeCertificate, isDomicileCertificate]);

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
      if (isCustomCertificate && serviceType) {
        const prediction = await api.predictRisk({ features: formData });
        navigate(`/service/${serviceType}/risk-summary`, {
          state: {
            prediction,
            applicationId,
            serviceType
          }
        });
        return;
      }

      await api.submitApplication(applicationId);
      window.location.href = "https://edistrict.cgstate.gov.in";
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="page csc-form-page">
      <div className="csc-form-topstrip">
        <div className="shell csc-form-topstrip-inner">
          <div className="csc-top-lang">Select Language</div>
          <div className="csc-top-cta">Continue with Digital India</div>
        </div>
      </div>

      <div className="csc-form-navbar">
        <div className="shell csc-form-navbar-inner">
          <div className="csc-form-brand">
            <div className="csc-form-brand-logo">CSC</div>
            <div>
              <p className="csc-form-brand-title">Common Service Center</p>
              <p className="csc-form-brand-subtitle">Digital Seva Portal</p>
            </div>
          </div>
          <div className="csc-form-nav-actions">
            <button className="btn secondary">Join Us as a VLE</button>
            <button className="btn">Login</button>
          </div>
        </div>
      </div>

      <div className="shell csc-form-shell">
        <div className="header csc-form-header">
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
          <div className={`layout csc-form-layout ${isCustomCertificate ? "no-panel" : ""}`}>
            <div className="grid csc-form-grid">
              <DynamicForm schema={schema} formData={formData} onChange={handleChange} />
              <DocumentUploader
                applicationId={applicationId}
                requiredDocuments={requiredDocuments}
                documentLabels={{ income_proof: "income proof (category)" }}
                onUploaded={handleUploaded}
              />
              <div className="card csc-submit-card">
                {!isCustomCertificate && (
                  <button className="btn" onClick={validateApplication} disabled={validating}>
                    {validating ? "Validating..." : "Validate Application"}
                  </button>
                )}
                <button className="btn secondary" onClick={submitApplication}>
                  {isCustomCertificate ? "Continue to Risk Summary" : "Submit to eDistrict"}
                </button>
              </div>
            </div>
            {!isCustomCertificate && <ValidationPanel validationResult={validationResult} />}
          </div>
        )}
      </div>
    </div>
  );
}
