const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export type ServiceSchema = {
  service_id: string;
  service_name: string;
  service_type: string;
  category?: string;
  sections?: Array<{
    name: string;
    fields: Array<{
      key: string;
      type: string;
      required?: boolean;
      options?: string[];
    }>;
  }>;
  required_documents?: {
    mandatory?: string[];
    optional?: string[];
    accepted_groups?: Record<string, string[]>;
  };
};

export type ValidationResult = {
  application_id: string;
  warnings: string[];
  missing_documents: string[];
  document_verification?: {
    mismatches: Array<{ field: string; reason: string }>;
    field_mismatch_count: number;
    document_quality_score: number;
  };
  risk?: {
    risk_score?: number;
    risk_level?: string;
  };
  explanation?: string;
};

export type RiskPredictionResult = {
  risk_probability?: number;
  risk_score?: number;
  risk_level?: string;
  rejected_prediction?: boolean;
  threshold_used?: number;
  main_contributing_factors?: string[];
  [key: string]: unknown;
};

function getOperatorId() {
  return localStorage.getItem("operator_id") || "operator_demo";
}

async function request(path: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-operator-id": getOperatorId(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json();
}

export const api = {
  createOperator: (payload: Record<string, unknown>) =>
    request("/operators", { method: "POST", body: JSON.stringify(payload) }),
  getServices: (): Promise<{ services: ServiceSchema[] }> => request("/services"),
  getServiceSchema: (serviceType: string): Promise<{ service: ServiceSchema }> => request(`/services/${serviceType}`),
  createApplicationDraft: (payload: Record<string, unknown>): Promise<{ application_id: string }> =>
    request("/applications", { method: "POST", body: JSON.stringify(payload) }),
  validateApplication: (payload: Record<string, unknown>): Promise<ValidationResult> =>
    request("/validate-application", { method: "POST", body: JSON.stringify(payload) }),
  predictRisk: (payload: Record<string, unknown>): Promise<RiskPredictionResult> =>
    request("/predict-risk", { method: "POST", body: JSON.stringify(payload) }),
  submitApplication: (applicationId: string): Promise<{ application_id: string; status: string }> =>
    request(`/applications/${applicationId}/submit`, { method: "POST" }),
  uploadDocument: async (applicationId: string, documentType: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const response = await fetch(`${API_BASE}/applications/${applicationId}/documents`, {
      method: "POST",
      headers: {
        "x-operator-id": getOperatorId()
      },
      body: formData
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Upload failed");
    }

    return response.json();
  }
};
