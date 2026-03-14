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

function buildPrompt({ message, language, page, serviceType, applicationId, context }) {
  const instructions = [
    "You are CSC Operator Assistant for CSC AI Copilot.",
    "You help operators complete pre-submission validation and guide them through form fields and documents.",
    "Do not provide legal advice, approvals, or submit to any government portal.",
    "Use only the provided context + general public-service guidance.",
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
    operatorContext: context.operator || null
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
