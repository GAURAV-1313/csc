const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RISK_THRESHOLD = 0.5;
const DEFAULT_MODEL_URL = "https://csc-risk-model-api.onrender.com/predict-risk";
const { usesIncomeEligibility, normalizeServiceType } = require("../services/servicePolicy");
const REQUIRED_RAW_KEYS = [
  "service_type",
  "age",
  "gender",
  "caste",
  "district",
  "annual_income",
  "average_income_last_3_years",
  "missing_documents_count",
  "missing_fields_count",
  "field_mismatch_count",
  "document_quality_score",
  "age_eligible",
  "income_eligible",
  "district_valid"
];

async function callMlApi(features, context = {}) {
  const url = process.env.ML_API_URL || DEFAULT_MODEL_URL;
  if (!url) {
    return null;
  }

  const normalizedFeatures = applyServicePolicyToFeatures(features, context);

  const featureValidation = validateEngineeredFeatures(normalizedFeatures);
  if (!featureValidation.ok) {
    return {
      code: "VALIDATION_ERROR",
      error: "Invalid engineered features",
      details: featureValidation
    };
  }

  const retries = Number(process.env.ML_API_RETRIES || DEFAULT_RETRIES);
  const timeoutMs = Number(process.env.ML_API_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const body = buildRequestBody(normalizedFeatures, context);
  const strictValidation = (process.env.ML_STRICT_VALIDATION || "true").toLowerCase() !== "false";
  if (strictValidation) {
    const validation = validateRequestBody(body);
    if (!validation.ok) {
      return {
        code: "VALIDATION_ERROR",
        error: "Invalid ML request payload",
        details: validation
      };
    }
  }
  const headers = buildRequestHeaders();

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text();
        if (attempt === retries) {
          return { error: `ML API error ${response.status}: ${text}` };
        }
      } else {
        const payload = await parseResponse(response);
        logRiskDiagnostics("raw_model_response", {
          service_type: normalizedFeatures && normalizedFeatures.service_type,
          application_id: context.applicationId || null,
          payload
        });

        const normalized = normalizeRiskResponse(payload, {
          serviceType: normalizedFeatures && normalizedFeatures.service_type
        });
        logRiskDiagnostics("mapped_model_response", {
          service_type: normalizedFeatures && normalizedFeatures.service_type,
          application_id: context.applicationId || null,
          payload: normalized
        });
        return normalized;
      }
    } catch (err) {
      if (attempt === retries) {
        return { error: err.message };
      }
    } finally {
      clearTimeout(timeout);
    }

    await delay(300 * (attempt + 1));
  }

  return { error: "ML API unavailable" };
}

function buildRequestBody(features, context) {
  const mode = (process.env.ML_API_PAYLOAD_MODE || "raw").toLowerCase();
  if (mode === "raw") {
    return buildRawPayload(features, context);
  }

  return {
    features: features || {},
    service_type: context.serviceType || null,
    application_id: context.applicationId || null,
    citizen_data: context.citizenData || null
  };
}

function buildRawPayload(features, context) {
  const source = {
    ...(context.citizenData || {}),
    ...(features || {})
  };

  const age = normalizeNumber(firstDefined(source.age, source.age_of_beneficiary));
  const annualIncome = normalizeNumber(source.annual_income);
  const averageIncome = normalizeNumber(firstDefined(source.average_income_last_3_years, annualIncome));
  const district = normalizeString(source.district);

  const serviceType = normalizeString(firstDefined(source.service_type, context.serviceType, "unknown"));
  const enforceIncomeEligibility = !usesIncomeEligibility(serviceType);

  return {
    service_type: serviceType,
    age: age == null ? 0 : age,
    gender: normalizeString(source.gender) || "unknown",
    caste: normalizeString(firstDefined(source.caste, source.caste_obc, source.category)) || "unknown",
    district: district || "unknown",
    annual_income: annualIncome == null ? 0 : annualIncome,
    average_income_last_3_years: averageIncome == null ? 0 : averageIncome,
    missing_documents_count: normalizeInt(source.missing_documents_count, 0),
    missing_fields_count: normalizeInt(source.missing_fields_count, 0),
    field_mismatch_count: normalizeInt(source.field_mismatch_count, 0),
    document_quality_score: clamp(normalizeNumber(source.document_quality_score) ?? 1, 0, 1),
    age_eligible: toBinaryFlag(firstDefined(source.age_eligible, age == null ? true : age >= 18)),
    income_eligible: enforceIncomeEligibility
      ? 1
      : toBinaryFlag(firstDefined(source.income_eligible, annualIncome == null ? true : annualIncome <= 300000)),
    district_valid: toBinaryFlag(firstDefined(source.district_valid, Boolean(district)))
  };
}

function validateRequestBody(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, reason: "Payload must be an object", missing: [] };
  }

  if (body.features && typeof body.features === "object") {
    const missingWrapped = REQUIRED_RAW_KEYS.filter(
      (key) => body.features[key] === undefined || body.features[key] === null || body.features[key] === ""
    );
    if (missingWrapped.length > 0) {
      return { ok: false, reason: "wrapped_payload_missing_required_fields", missing: missingWrapped };
    }
    return { ok: true, reason: "wrapped_payload", missing: [] };
  }

  const missing = REQUIRED_RAW_KEYS.filter((key) => body[key] === undefined || body[key] === null || body[key] === "");
  if (missing.length > 0) {
    return { ok: false, reason: "missing_required_fields", missing };
  }

  return { ok: true, reason: "raw_payload", missing: [] };
}

function buildRequestHeaders() {
  const headers = { "Content-Type": "application/json" };

  const customHeaders = parseCustomHeaders(process.env.ML_API_HEADERS_JSON);
  Object.assign(headers, customHeaders);

  if (!headers.Authorization && process.env.ML_API_TOKEN) {
    const scheme = process.env.ML_API_AUTH_SCHEME || "Bearer";
    headers.Authorization = `${scheme} ${process.env.ML_API_TOKEN}`;
  }

  return headers;
}

function parseCustomHeaders(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    return {};
  }
}

async function parseResponse(response) {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    return { raw_response: text };
  }
}

function normalizeRiskResponse(payload, context = {}) {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid ML API payload" };
  }

  const threshold = normalizeProbability(
    firstDefined(payload.threshold_used, payload.threshold, process.env.ML_API_RISK_THRESHOLD, DEFAULT_RISK_THRESHOLD)
  );

  const probability = normalizeProbability(
    firstDefined(payload.risk_probability, payload.probability, payload.prob, payload.riskProbability)
  );

  const score = normalizeProbability(
    firstDefined(payload.risk_score, payload.score, payload.riskScore, probability)
  );

  const resolvedProbability = probability == null ? 0 : probability;
  const resolvedScore = score == null ? resolvedProbability : score;

  const resolvedLevel = String(
    firstDefined(payload.risk_level, payload.level, inferRiskLevel(resolvedScore, threshold))
  );

  const rawFactorsValue = firstDefined(payload.main_contributing_factors, payload.contributing_factors, payload.top_factors);
  const factors = normalizeFactors(
    rawFactorsValue
  );

  const serviceType = normalizeServiceType(firstDefined(context.serviceType, payload.service_type));
  const policyFilteredFactors = usesIncomeEligibility(serviceType)
    ? factors
    : factors.filter((factor) => !isIncomeEligibilityFactor(factor));

  const hasFactorsKey = Object.prototype.hasOwnProperty.call(payload, "main_contributing_factors")
    || Object.prototype.hasOwnProperty.call(payload, "contributing_factors")
    || Object.prototype.hasOwnProperty.call(payload, "top_factors");
  const finalizedFactors = hasFactorsKey && factors.length === 0
    ? ["Model returned an empty contributing factors list"]
    : policyFilteredFactors;

  const rejected = firstDefined(
    payload.rejected_prediction,
    payload.rejected,
    payload.is_rejected,
    resolvedScore != null && threshold != null ? resolvedScore >= threshold : undefined
  );

  const rejectedFlag = normalizeBinaryFlag(rejected, resolvedScore >= (threshold == null ? DEFAULT_RISK_THRESHOLD : threshold));

  const mapped = {
    ...payload,
    risk_probability: resolvedProbability,
    risk_score: resolvedScore,
    risk_level: resolvedLevel,
    rejected_prediction: rejectedFlag,
    threshold_used: threshold == null ? DEFAULT_RISK_THRESHOLD : threshold,
    main_contributing_factors: finalizedFactors
  };

  return {
    ...mapped,
    rejectedPrediction: mapped.rejected_prediction,
    thresholdUsed: mapped.threshold_used,
    mainContributingFactors: mapped.main_contributing_factors
  };
}

function applyServicePolicyToFeatures(features, context) {
  const safe = features && typeof features === "object" ? { ...features } : {};
  const serviceType = normalizeServiceType(firstDefined(safe.service_type, context && context.serviceType));
  if (serviceType) {
    safe.service_type = serviceType;
  }

  if (!usesIncomeEligibility(serviceType)) {
    safe.income_eligible = 1;
  }

  return safe;
}

function isIncomeEligibilityFactor(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "income_eligible" || normalized === "income eligibility" || normalized.includes("income_eligible");
}

function inferRiskLevel(score, threshold) {
  if (score == null) return "unknown";
  const cut = threshold == null ? DEFAULT_RISK_THRESHOLD : threshold;
  if (score >= cut + 0.2) return "high";
  if (score >= cut) return "medium";
  return "low";
}

function normalizeFactors(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function validateEngineeredFeatures(features) {
  if (!features || typeof features !== "object") {
    return { ok: false, reason: "features must be an object", missing: REQUIRED_RAW_KEYS };
  }

  const missing = REQUIRED_RAW_KEYS.filter((key) => features[key] === undefined || features[key] === null || features[key] === "");
  if (missing.length > 0) {
    return { ok: false, reason: "missing_engineered_features", missing };
  }
  return { ok: true, reason: "ok", missing: [] };
}

function normalizeProbability(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  if (n > 1 && n <= 100) {
    return Number((n / 100).toFixed(4));
  }
  return Number(n.toFixed(4));
}

function normalizeInt(value, fallback) {
  const n = normalizeNumber(value);
  if (n == null) return fallback;
  return Math.max(0, Math.round(n));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n;
}

function normalizeString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
  }
  return Boolean(value);
}

function toBinaryFlag(value) {
  return normalizeBoolean(value) ? 1 : 0;
}

function normalizeBinaryFlag(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback ? 1 : 0;
  }
  if (typeof value === "number") return value > 0 ? 1 : 0;
  if (typeof value === "boolean") return value ? 1 : 0;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") return 1;
  if (normalized === "0" || normalized === "false" || normalized === "no") return 0;
  return fallback ? 1 : 0;
}

function logRiskDiagnostics(label, payload) {
  if (process.env.NODE_ENV === "production") return;
  try {
    console.log(`[risk-diagnostics] ${label}`, payload);
  } catch {
    // Ignore diagnostics failures.
  }
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  callMlApi,
  normalizeRiskResponse,
  inferRiskLevel,
  applyServicePolicyToFeatures
};
