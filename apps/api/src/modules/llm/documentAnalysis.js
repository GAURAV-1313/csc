const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ANALYSIS_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["is_match", "format_ok", "confidence", "issues", "suggestions", "extracted_identity_clues"],
  properties: {
    is_match: { type: "BOOLEAN" },
    format_ok: { type: "BOOLEAN" },
    confidence: { type: "NUMBER" },
    issues: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    suggestions: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    extracted_identity_clues: {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  }
};

function toJsonSafe(value, fallback = "{}") {
  try {
    return JSON.stringify(value, null, 2);
  } catch (_) {
    return fallback;
  }
}

function pickMimeType(filePath) {
  const ext = path.extname(filePath || "").toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".avif") return "image/avif";
  if (ext === ".pdf") return "application/pdf";
  return null;
}

async function getInlineDataPayload(filePath, mimeType) {
  // Convert AVIF to PNG for broader model compatibility.
  if (mimeType === "image/avif") {
    try {
      const image = await loadImage(filePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      return {
        mimeType: "image/png",
        data: canvas.toBuffer("image/png").toString("base64")
      };
    } catch (_) {
      return null;
    }
  }

  try {
    return {
      mimeType,
      data: fs.readFileSync(filePath).toString("base64")
    };
  } catch (_) {
    return null;
  }
}

function parseJsonFromText(text) {
  if (!text) return null;
  const trimmed = text.replace(/^\uFEFF/, "").trim();

  // Handle common fenced output: ```json { ... } ```
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch (_) {
    // Try broad extraction from first "{" to last "}"
    const first = unfenced.indexOf("{");
    const last = unfenced.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const slice = unfenced.slice(first, last + 1);
      try {
        return JSON.parse(slice);
      } catch (__ ) {
        // Continue to balanced scan fallback.
      }
    }

    // Balanced brace scan to recover first valid JSON object.
    for (let i = 0; i < unfenced.length; i += 1) {
      if (unfenced[i] !== "{") continue;
      let depth = 0;
      let inString = false;
      let escaped = false;
      for (let j = i; j < unfenced.length; j += 1) {
        const ch = unfenced[j];
        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (ch === "\\") {
            escaped = true;
          } else if (ch === '"') {
            inString = false;
          }
          continue;
        }
        if (ch === '"') {
          inString = true;
          continue;
        }
        if (ch === "{") depth += 1;
        if (ch === "}") depth -= 1;
        if (depth === 0) {
          const candidate = unfenced.slice(i, j + 1);
          try {
            return JSON.parse(candidate);
          } catch (___) {
            break;
          }
        }
      }
    }

    return null;
  }
}

function normalizeConfidence(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return num;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const text = String(value || "").trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(text)) return true;
  if (["false", "0", "no", "n"].includes(text)) return false;
  return fallback;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function toAnalysisResult(parsed) {
  return {
    is_match: normalizeBoolean(parsed?.is_match, false),
    format_ok: normalizeBoolean(parsed?.format_ok, false),
    confidence: normalizeConfidence(parsed?.confidence),
    issues: normalizeStringArray(parsed?.issues),
    suggestions: normalizeStringArray(parsed?.suggestions),
    extracted_identity_clues: normalizeStringArray(parsed?.extracted_identity_clues)
  };
}

function readModelText(data) {
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
  const withParts = candidates.find((candidate) => Array.isArray(candidate?.content?.parts) && candidate.content.parts.length > 0);
  if (!withParts) return "";
  return withParts.content.parts.map((p) => p?.text || "").join("\n");
}

async function requestStructuredJson({ url, parts }) {
  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 450,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_RESPONSE_SCHEMA
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  return response;
}

async function repairMalformedJson({ url, raw }) {
  if (!raw || !raw.trim()) return null;
  const repairPrompt = [
    "Convert the following output into strict JSON only.",
    "Use exactly these keys: is_match, format_ok, confidence, issues, suggestions, extracted_identity_clues.",
    "If some value is missing, use: false/false/0.0/[]/[]/[].",
    "Output JSON only.",
    "Malformed output:",
    raw
  ].join("\n");

  const response = await requestStructuredJson({
    url,
    parts: [{ text: repairPrompt }]
  });

  if (!response.ok) return null;
  const data = await response.json();
  const repairedRaw = readModelText(data);
  return parseJsonFromText(repairedRaw);
}

async function analyzeUploadedDocumentAI({ filePath, documentType, ocrFields, serviceType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !filePath) return null;

  const prompt = [
    "You are a CSC document verification assistant.",
    "Analyze whether the uploaded document appears to match the expected document type.",
    "Return strict JSON only with keys:",
    "is_match (boolean), format_ok (boolean), confidence (number 0..1), issues (string[]), suggestions (string[]), extracted_identity_clues (string[]).",
    "Do not include markdown.",
    `expected_document_type: ${documentType || "unknown"}`,
    `service_type: ${serviceType || "unknown"}`,
    "ocr_fields_json:",
    toJsonSafe(ocrFields || {})
  ].join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

  const parts = [{ text: prompt }];
  const mimeType = pickMimeType(filePath);
  if (mimeType) {
    try {
      const stat = fs.statSync(filePath);
      // Keep payload size moderate to avoid request failures.
      if (stat.size <= 2 * 1024 * 1024) {
        const payload = await getInlineDataPayload(filePath, mimeType);
        if (payload && payload.data) {
          parts.push({ inlineData: payload });
        }
      }
    } catch (_) {
      // If file read fails, continue with OCR-only analysis.
    }
  }

  try {
    const response = await requestStructuredJson({ url, parts });

    if (!response.ok) {
      return {
        is_match: false,
        format_ok: false,
        confidence: null,
        issues: [`AI analysis unavailable (${response.status}). Manual review required.`],
        suggestions: ["Proceed with manual operator review."],
        extracted_identity_clues: []
      };
    }

    const data = await response.json();
    const raw = readModelText(data);
    let parsed = parseJsonFromText(raw);
    if (!parsed) {
      parsed = await repairMalformedJson({ url, raw });
    }

    if (!parsed) {
      return {
        is_match: false,
        format_ok: false,
        confidence: null,
        issues: ["AI response could not be parsed. Manual review required."],
        suggestions: ["Proceed with manual operator review."],
        extracted_identity_clues: []
      };
    }

    return toAnalysisResult(parsed);
  } catch (err) {
    return {
      is_match: false,
      format_ok: false,
      confidence: null,
      issues: [`AI request failed: ${err?.message || String(err)}. Manual review required.`],
      suggestions: ["Proceed with manual operator review."],
      extracted_identity_clues: []
    };
  }
}

module.exports = { analyzeUploadedDocumentAI };
