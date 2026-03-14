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
    </div>
  );
}
