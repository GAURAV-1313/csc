import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type ServiceSchema, type ValidationResult, type CitizenReport } from "../services/api";
import DynamicForm from "../components/DynamicForm";
import DocumentUploader from "../components/DocumentUploader";
import ValidationPanel from "../components/ValidationPanel";
import WhatsAppWidget from "../components/WhatsAppWidget";

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

const GENDER_OPTIONS = ["Male", "Female", "Other"];

function applyUiFieldRules(baseSchema: ServiceSchema | null): ServiceSchema | null {
  if (!baseSchema) return baseSchema;

  return {
    ...baseSchema,
    sections: (baseSchema.sections || []).map((section) => ({
      ...section,
      fields: (section.fields || []).map((field) => {
        const key = String(field.key || "").toLowerCase();

        if (key === "gender") {
          return {
            ...field,
            type: "select",
            options: GENDER_OPTIONS
          };
        }

        if (key.includes("pin_code")) {
          return {
            ...field,
            type: "text",
            maxLength: 6
          };
        }

        return field;
      })
    }))
  };
}

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
        { key: "applicant_name", type: "text", required: true },
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
        { key: "date", type: "date", required: true }
      ]
    }
  ],
  required_documents: {
    mandatory: ["affidavit", "proof_of_15_years_residence", "educational_certificate", "signature"],
    optional: []
  }
};

const scStCertificateSchema: ServiceSchema = {
  service_id: "sc_st_certificate",
  service_name: "SC/ST Certificate",
  service_type: "sc_st_certificate",
  sections: [
    {
      name: "General Details",
      fields: [
        { key: "beneficiary_guardian_type", type: "text", required: true },
        { key: "beneficiary_guardian_name", type: "text", required: true },
        { key: "guardian_type_english", type: "text", required: true },
        { key: "guardian_name_english", type: "text", required: true },
        { key: "gender", type: "text", required: true },
        { key: "marital_status", type: "text", required: true },
        { key: "date_of_birth", type: "date", required: true },
        { key: "relation_to_applicant", type: "text", required: true },
        { key: "caste", type: "text", required: true },
        { key: "category", type: "text", required: true },
        { key: "caste_english", type: "text", required: true },
        { key: "category_english", type: "text", required: true },
        { key: "category_number", type: "text", required: true },
        { key: "beneficiary_name_english", type: "text", required: true }
      ]
    },
    {
      name: "Present Address",
      fields: [
        { key: "address", type: "textarea", required: true },
        { key: "pin_code", type: "text", required: true },
        { key: "post_box_number", type: "text", required: true },
        { key: "district", type: "text", required: true },
        { key: "address_english", type: "textarea", required: true },
        { key: "present_permanent_same", type: "boolean", required: true }
      ]
    },
    {
      name: "Permanent Address",
      fields: [
        { key: "permanent_address", type: "textarea", required: true },
        { key: "permanent_pin_code", type: "text", required: true },
        { key: "permanent_district", type: "text", required: true },
        { key: "permanent_post_box_number", type: "text", required: true },
        { key: "police_station", type: "text", required: true }
      ]
    },
    {
      name: "Permanent Address Before 1950",
      fields: [
        { key: "village_or_town", type: "text", required: true },
        { key: "patwari_halka_number", type: "text", required: true },
        { key: "tehsil", type: "text", required: true },
        { key: "district_before_1950", type: "text", required: true },
        { key: "head_of_family_name", type: "text", required: true },
        { key: "relation_to_head_of_family", type: "text", required: true }
      ]
    },
    {
      name: "Residence Since 1950",
      fields: [
        { key: "guardian_residence_since_1950", type: "textarea", required: true },
        { key: "guardian_address_details", type: "textarea", required: true }
      ]
    },
    {
      name: "Other Details",
      fields: [
        { key: "previous_scst_certificate", type: "boolean", required: true },
        { key: "document_proof_for_scst", type: "text", required: true }
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
    mandatory: ["caste_proof", "signature"],
    optional: ["affidavit", "vanshavali", "gram_sabha_proposal"],
    accepted_groups: {
      caste_proof: [
        "caste_certificate_other_state",
        "certificate_from_sarpanch",
        "school_transfer_certificate",
        "father_service_certificate",
        "educational_certificate",
        "census_register",
        "citizen_register",
        "jamabandi"
      ]
    }
  }
};

const obcCertificateSchema: ServiceSchema = {
  service_id: "obc_certificate",
  service_name: "OBC Certificate",
  service_type: "obc_certificate",
  sections: [
    {
      name: "General Details",
      fields: [
        { key: "beneficiary_guardian_type", type: "text", required: true },
        { key: "beneficiary_guardian_name", type: "text", required: true },
        { key: "guardian_type_english", type: "text", required: true },
        { key: "guardian_name_english", type: "text", required: true },
        { key: "gender", type: "text", required: true },
        { key: "marital_status", type: "text", required: true },
        { key: "date_of_birth", type: "date", required: true },
        { key: "relation_to_applicant", type: "text", required: true },
        { key: "caste_obc", type: "text", required: true },
        { key: "category", type: "text", required: true },
        { key: "caste_english", type: "text", required: true },
        { key: "category_english", type: "text", required: true },
        { key: "category_number", type: "text", required: true },
        { key: "beneficiary_name_english", type: "text", required: true }
      ]
    },
    {
      name: "Present Address",
      fields: [
        { key: "address", type: "textarea", required: true },
        { key: "pin_code", type: "text", required: true },
        { key: "post_box_number", type: "text", required: true },
        { key: "district", type: "text", required: true },
        { key: "address_english", type: "textarea", required: true },
        { key: "present_permanent_same", type: "boolean", required: true }
      ]
    },
    {
      name: "Permanent Address",
      fields: [
        { key: "permanent_address", type: "textarea", required: true },
        { key: "permanent_pin_code", type: "text", required: true },
        { key: "permanent_district", type: "text", required: true },
        { key: "permanent_post_box_number", type: "text", required: true },
        { key: "police_station", type: "text", required: true }
      ]
    },
    {
      name: "Historical Address",
      fields: [
        { key: "village_or_town", type: "text", required: true },
        { key: "patwari_halka_number", type: "text", required: true },
        { key: "tehsil", type: "text", required: true },
        { key: "historical_district", type: "text", required: true },
        { key: "head_of_family_name", type: "text", required: true },
        { key: "relation_to_head_of_family", type: "text", required: true }
      ]
    },
    {
      name: "Residence Since 1984",
      fields: [
        { key: "guardian_residence_since_1984", type: "textarea", required: true },
        { key: "guardian_address_details", type: "textarea", required: true }
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
    mandatory: ["affidavit", "income_proof", "obc_proof", "signature"],
    optional: ["vanshavali", "gram_sabha_proposal"],
    accepted_groups: {
      income_proof: [
        "patwari_certificate",
        "sarpanch_certificate",
        "employer_income_certificate",
        "form16"
      ],
      obc_proof: [
        "obc_certificate_of_father",
        "educational_certificate",
        "school_transfer_certificate",
        "jamabandi",
        "census_register"
      ]
    }
  }
};

const landUseInformationSchema: ServiceSchema = {
  service_id: "land_use_information",
  service_name: "Land Use Information",
  service_type: "land_use_information",
  sections: [
    {
      name: "Applicant Details",
      fields: [
        { key: "applicant_name", type: "text", required: true },
        { key: "father_name", type: "text", required: true }
      ]
    },
    {
      name: "Land Details",
      fields: [
        { key: "village_name", type: "text", required: true },
        { key: "patwari_halka_number", type: "text", required: true },
        { key: "khasra_number", type: "text", required: true },
        { key: "is_applicant_owner", type: "boolean", required: true }
      ]
    },
    {
      name: "Declaration",
      fields: [
        { key: "date", type: "date", required: true },
        { key: "place", type: "text", required: true },
        { key: "declaration_applicant_name", type: "text", required: true }
      ]
    }
  ],
  required_documents: {
    mandatory: ["khasra", "naksha", "challan_copy", "signature"],
    optional: []
  }
};

const birthCertificateCorrectionSchema: ServiceSchema = {
  service_id: "birth_certificate_correction",
  service_name: "Birth Certificate Correction",
  service_type: "birth_certificate_correction",
  sections: [
    {
      name: "Application Info",
      fields: [{ key: "application_number", type: "text", required: true }]
    },
    {
      name: "Place of Birth",
      fields: [
        { key: "birth_place_type", type: "text", required: true },
        { key: "hospital_or_institute_name", type: "text", required: true },
        { key: "birth_place_local_language", type: "textarea", required: true },
        { key: "birth_place_english", type: "textarea", required: true }
      ]
    },
    {
      name: "Child Birth Registration",
      fields: [
        { key: "date_of_birth", type: "date", required: true },
        { key: "gender", type: "text", required: true },
        { key: "child_name_local_language", type: "text", required: true },
        { key: "child_name_english", type: "text", required: true },
        { key: "registration_number", type: "text", required: true },
        { key: "registration_date", type: "date", required: true }
      ]
    },
    {
      name: "Father Details",
      fields: [
        { key: "father_name_local_language", type: "text", required: true },
        { key: "father_name_english", type: "text", required: true },
        { key: "father_aadhaar_number", type: "text", required: true }
      ]
    },
    {
      name: "Guardian Address",
      fields: [
        { key: "address_at_time_of_birth_local_language", type: "textarea", required: true },
        { key: "address_at_time_of_birth_english", type: "textarea", required: true },
        { key: "permanent_address_local_language", type: "textarea", required: true },
        { key: "permanent_address_english", type: "textarea", required: true }
      ]
    },
    {
      name: "Mother Details",
      fields: [
        { key: "mother_name_local_language", type: "text", required: true },
        { key: "mother_name_english", type: "text", required: true },
        { key: "mother_aadhaar_number", type: "text", required: true }
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
    mandatory: ["existing_birth_certificate", "supporting_correction_proof", "signature"],
    optional: ["hospital_record", "school_record"]
  }
};

export default function ApplicationForm() {
  const { serviceType } = useParams<{ serviceType: string }>();
  const isIncomeCertificate = serviceType === "income_certificate";
  const isDomicileCertificate = serviceType === "domicile_certificate";
  const isScStCertificate = serviceType === "sc_st_certificate";
  const isObcCertificate = serviceType === "obc_certificate";
  const isLandUseInformation = serviceType === "land_use_information";
  const isBirthCertificateCorrection = serviceType === "birth_certificate_correction";
  const isCustomCertificate =
    isIncomeCertificate ||
    isDomicileCertificate ||
    isScStCertificate ||
    isObcCertificate ||
    isLandUseInformation ||
    isBirthCertificateCorrection;
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
        const selectedSchema =
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
              : isScStCertificate
                ? {
                    ...scStCertificateSchema,
                    service_name: service.service?.service_name || scStCertificateSchema.service_name
                  }
                : isObcCertificate
                  ? {
                      ...obcCertificateSchema,
                      service_name: service.service?.service_name || obcCertificateSchema.service_name
                    }
                  : isLandUseInformation
                    ? {
                        ...landUseInformationSchema,
                        service_name: service.service?.service_name || landUseInformationSchema.service_name
                      }
                    : isBirthCertificateCorrection
                      ? {
                          ...birthCertificateCorrectionSchema,
                          service_name:
                            service.service?.service_name || birthCertificateCorrectionSchema.service_name
                        }
              : service.service;

        setSchema(applyUiFieldRules(selectedSchema));

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
  }, [
    serviceType,
    isIncomeCertificate,
    isDomicileCertificate,
    isScStCertificate,
    isObcCertificate,
    isLandUseInformation,
    isBirthCertificateCorrection
  ]);

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
      if (isCustomCertificate && serviceType) {
        const documentsForRisk = uploadedDocs.map((doc) => ({
          documentType: (doc.document_type as string) || (doc.documentType as string),
          filePath: (doc.file_path as string) || (doc.filePath as string)
        }));

        const ocrResultsForRisk = uploadedDocs
          .map((doc) => {
            const fields: Record<string, unknown> = {};
            const parsed = (doc.document_fields as Array<{ field_name?: string; field_value?: unknown }>) || [];
            parsed.forEach((entry) => {
              if (!entry?.field_name) return;
              fields[entry.field_name] = entry.field_value;
            });
            if (Object.keys(fields).length === 0) {
              return null;
            }
            return { fields };
          })
          .filter(Boolean);

        const prediction = await api.predictRisk({
          features: formData,
          serviceType,
          application_id: applicationId,
          citizenData: formData,
          documents: documentsForRisk,
          ocrResults: ocrResultsForRisk
        });
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
          <div className={`layout csc-form-layout ${isCustomCertificate ? "no-panel" : ""}`}>
            <div className="grid csc-form-grid">
              <DynamicForm schema={schema} formData={formData} onChange={handleChange} />
              <DocumentUploader
                applicationId={applicationId}
                requiredDocuments={requiredDocuments}
                documentLabels={{
                  income_proof: isIncomeCertificate ? "income proof (category)" : "income proof",
                  caste_proof: "caste proof",
                  obc_proof: "obc proof"
                }}
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

      <WhatsAppWidget />
    </div>
  );
}
