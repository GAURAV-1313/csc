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
      maxLength?: number;
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

/** Shape returned by GET /public/whatsapp-launch-config (bot format) */
export type WhatsappLaunchConfig = {
  /** Deep-link URL, e.g. https://wa.me/19312978613?text=START */
  deep_link?: string;
  /** Fallback URL (same as deep_link on most platforms) */
  fallback_link?: string;
  whatsapp_number?: string;
  start_text?: string;
  is_sandbox?: boolean;
  /** Legacy field from local config */
  whatsapp_url?: string;
  phone_number?: string;
  greeting_message?: string;
};

/** Shape of a document entry inside a citizen report */
export type CitizenDocument = {
  type: string;
  status: "available" | "missing" | string;
  label: string;
};

/** Shape returned by GET /whatsapp-report/:referenceId */
export type CitizenReport = {
  reference_id: string;
  status: string;
  service_type: string;
  completed_at?: string;
  citizen_data: Record<string, string | null>;
  documents?: CitizenDocument[];
  pdf_url?: string;
  view_url?: string;
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
  },

  /** Fetch the WhatsApp launch config (deep-link URL etc.) for the "Start on WhatsApp" button. */
  getWhatsappLaunchConfig: (): Promise<WhatsappLaunchConfig> =>
    request("/public/whatsapp-launch-config"),

  /**
   * Fetch a citizen's pre-check report from the external WhatsApp bot by Reference ID.
   * Requires BOT_API_BASE_URL and BOT_API_TOKEN to be set on the API server.
   * Reference IDs are in the format PC-XXXXXX.
   */
  getWhatsappReport: (referenceId: string): Promise<CitizenReport> =>
    request(`/whatsapp-report/${encodeURIComponent(referenceId.toUpperCase())}`),

  /**
   * Same as getWhatsappReport but uses a POST body lookup.
   * Useful as a fallback when the Reference ID contains characters that
   * need special handling in URL path segments.
   */
  lookupWhatsappReport: (referenceId: string): Promise<CitizenReport> =>
    request("/whatsapp-report/lookup", {
      method: "POST",
      body: JSON.stringify({ reference_id: referenceId.toUpperCase() })
    })
};
