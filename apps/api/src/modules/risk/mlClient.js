const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RISK_THRESHOLD = 0.5;

async function callMlApi(features, context = {}) {
  const url = process.env.ML_API_URL;
  if (!url) {
    return null;
  }

  const retries = Number(process.env.ML_API_RETRIES || DEFAULT_RETRIES);
  const timeoutMs = Number(process.env.ML_API_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const body = buildRequestBody(features, context);
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
        return normalizeRiskResponse(payload);
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
  const mode = (process.env.ML_API_PAYLOAD_MODE || "wrapped").toLowerCase();
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

  return {
    service_type: normalizeString(firstDefined(source.service_type, context.serviceType, "income_certificate")),
    age: age == null ? 0 : age,
    gender: normalizeString(source.gender),
    caste: normalizeString(firstDefined(source.caste, source.caste_obc, source.category)),
    district,
    annual_income: annualIncome == null ? 0 : annualIncome,
    average_income_last_3_years: averageIncome == null ? 0 : averageIncome,
    missing_documents_count: normalizeInt(source.missing_documents_count, 0),
    missing_fields_count: normalizeInt(source.missing_fields_count, 0),
    field_mismatch_count: normalizeInt(source.field_mismatch_count, 0),
    document_quality_score: normalizeNumber(source.document_quality_score) ?? 1,
    age_eligible: normalizeBoolean(firstDefined(source.age_eligible, age == null ? true : age >= 18)),
    income_eligible: normalizeBoolean(
      firstDefined(source.income_eligible, annualIncome == null ? true : annualIncome <= 300000)
    ),
    district_valid: normalizeBoolean(firstDefined(source.district_valid, Boolean(district)))
  };
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

function normalizeRiskResponse(payload) {
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

  if (probability == null && score == null) {
    return payload;
  }

  const resolvedLevel = String(
    firstDefined(payload.risk_level, payload.level, inferRiskLevel(score, threshold))
  ).toLowerCase();

  const factors = normalizeFactors(
    firstDefined(payload.main_contributing_factors, payload.contributing_factors, payload.top_factors)
  );

  const rejected = firstDefined(
    payload.rejected_prediction,
    payload.rejected,
    payload.is_rejected,
    score != null && threshold != null ? score >= threshold : undefined
  );

  return {
    ...payload,
    risk_probability: probability,
    risk_score: score,
    risk_level: resolvedLevel,
    rejected_prediction: rejected == null ? null : Boolean(rejected),
    threshold_used: threshold,
    main_contributing_factors: factors
  };
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

module.exports = { callMlApi };
