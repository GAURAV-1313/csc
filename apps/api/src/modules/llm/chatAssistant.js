const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function formatLanguageHint(language) {
  if (language === "hi") return "Respond in Hindi.";
  if (language === "hinglish") return "Respond in Hinglish (Hindi written in Latin script).";
  return "Respond in English.";
}

function compactSchema(service) {
  if (!service) return null;
  const fields = (service.fields || []).map((f) => ({
    key: f.key || f.name || f.field_id,
    label: f.label || f.name,
    type: f.type,
    required: f.required
  }));
  return {
    service_name: service.service_name,
    service_type: service.service_type,
    category: service.category,
    sections: service.sections || [],
    fields
  };
}

function safeStringify(value, fallback = "{}") {
  try {
    return JSON.stringify(value, null, 2);
  } catch (err) {
    return fallback;
  }
}

function normalizeDocKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toArrayStrings(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function normalizeDocuments(documents) {
  if (!Array.isArray(documents)) return [];
  return documents
    .map((doc) => {
      const type = doc?.document_type || doc?.documentType || doc?.type || "unknown";
      const status = doc?.document_status || doc?.status || "unknown";
      const parsedFields = Array.isArray(doc?.document_fields)
        ? doc.document_fields
        : Array.isArray(doc?.parsedFields)
          ? doc.parsedFields
          : [];
      const ocrText = typeof doc?.ocr_text === "string" ? doc.ocr_text : typeof doc?.ocrText === "string" ? doc.ocrText : "";
      const ocrPreview = ocrText ? String(ocrText).slice(0, 400) : "";
      const ai = doc?.ai_document_analysis && typeof doc.ai_document_analysis === "object"
        ? doc.ai_document_analysis
        : null;
      const extractedFields = parsedFields.slice(0, 20).map((item) => ({
        field: item?.field_name || item?.field || "",
        value: item?.field_value || item?.value || ""
      }));

      const aiIssues = ai && Array.isArray(ai.issues) ? ai.issues.map(String) : [];
      const formatReviewRequired = ai
        ? ai.is_match === false || ai.format_ok === false
        : status === "format_suspect" || status === "mismatch_detected";

      return {
        type,
        type_key: normalizeDocKey(type),
        status,
        extracted_fields: extractedFields,
        ocr_preview: ocrPreview,
        format_status: formatReviewRequired ? "review" : "ok",
        ai_summary: ai
          ? {
              is_match: ai.is_match === true,
              format_ok: ai.format_ok === true,
              confidence: typeof ai.confidence === "number" ? Number(ai.confidence) : null,
              issues: aiIssues,
              suggestions: Array.isArray(ai.suggestions) ? ai.suggestions.map(String) : []
            }
          : null
      };
    })
    .filter((doc) => doc.type || doc.extracted_fields.length > 0 || doc.ocr_preview);
}

function buildDocumentFormatContext(context) {
  const required = context.service?.required_documents || context.schema?.required_documents || {};
  const mandatory = toArrayStrings(required.mandatory);
  const optional = toArrayStrings(required.optional);
  const acceptedGroups = required.accepted_groups && typeof required.accepted_groups === "object"
    ? required.accepted_groups
    : {};

  const expectedDocuments = [...mandatory, ...optional].map((name) => {
    const accepted = toArrayStrings(acceptedGroups[name]);
    return {
      name,
      key: normalizeDocKey(name),
      required: mandatory.includes(name),
      accepted_formats: accepted.length > 0 ? accepted : [name]
    };
  });

  const uploaded = [
    ...normalizeDocuments(context.documents),
    ...normalizeDocuments(context.application?.documents)
  ];
  const latestByName = uploaded.reduce((acc, doc) => {
    const key = doc.type_key || normalizeDocKey(doc.type);
    if (!key) return acc;
    acc[key] = {
      type: doc.type,
      status: doc.status,
      format_status: doc.format_status,
      ai_summary: doc.ai_summary
    };
    return acc;
  }, {});

  return {
    expected_documents: expectedDocuments,
    uploaded_latest_by_document: latestByName,
    guidance: [
      "When user asks if a document is in current format by name, match by closest document name/key.",
      "Use accepted_formats as expected format list.",
      "If uploaded_latest_by_document has format_status=review, respond that manual review is required and include the first AI issue if present.",
      "If no uploaded document matches requested name, ask user to upload that document first."
    ]
  };
}

function buildDocumentInsights(context) {
  const requestDocuments = normalizeDocuments(context.documents);
  const applicationDocuments = normalizeDocuments(context.application?.documents);
  const allDocuments = [...requestDocuments, ...applicationDocuments];

  const mismatches = context.validation?.document_verification?.mismatches || [];
  const missingDocuments = context.validation?.missing_documents || [];

  return {
    total_uploaded_documents: allDocuments.length,
    uploaded_documents: allDocuments,
    missing_documents: missingDocuments,
    verification_mismatches: mismatches,
    guidance: "Prioritize document-based reasoning: identify missing docs, OCR extraction gaps, and field mismatches before giving next steps."
  };
}

function buildPrompt({ message, language, page, serviceType, applicationId, context }) {
  const instructions = [
    "You are CSC Operator Assistant for CSC AI Copilot.",
    "You help operators complete pre-submission validation and guide them through form fields and documents.",
    "You can also answer general-knowledge questions that are unrelated to CSC workflows.",
    "If the question is CSC-related, prioritize the provided context and explain next operator actions.",
    "If the question is general knowledge, answer directly and do not force CSC context.",
    "If user asks to validate format of a specific document by name, use documentFormatContext to answer whether current uploaded format looks OK or needs review.",
    "For document-format answers, keep response practical: requested document name, expected format(s), current status (OK/Review/Not uploaded), and one next action.",
    "Do not provide legal advice, approvals, or submit to any government portal.",
    "Use the provided context + general public-service guidance when relevant.",
    "If critical data is missing, ask a short clarifying question.",
    formatLanguageHint(language)
  ].join(" ");

  const payload = {
    page,
    serviceType,
    applicationId,
    serviceIntro: context.serviceIntro,
    validation: context.validation,
    documents: context.documents,
    citizenData: context.citizenData || context.citizen_data,
    application: context.application,
    schema: compactSchema(context.service || context.schema),
    operatorContext: context.operator || null,
    documentInsights: buildDocumentInsights(context),
    documentFormatContext: buildDocumentFormatContext(context)
  };

  return {
    system: instructions,
    user: [
      "Operator question:",
      message,
      "",
      "Context (JSON):",
      safeStringify(payload)
    ].join("\n")
  };
}

async function callGemini({ system, user }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "Gemini API key is not configured. Please set GEMINI_API_KEY.";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;
  const body = {
    systemInstruction: {
      role: "system",
      parts: [{ text: system }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: user }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detail = await response.text();
    return `Gemini request failed (${response.status}). ${detail}`;
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text).join("").trim();
  return text || "I could not generate a response. Please try again.";
}

async function chatWithAssistant({ message, language, page, serviceType, applicationId, context }) {
  if (process.env.LLM_MODE === "mock") {
    return "Demo mode: I can help with form fields, documents, and validation warnings once Gemini is enabled.";
  }

  const { system, user } = buildPrompt({
    message,
    language,
    page,
    serviceType,
    applicationId,
    context
  });

  return callGemini({ system, user });
}

module.exports = { chatWithAssistant };
