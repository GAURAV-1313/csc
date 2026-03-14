const test = require("node:test");
const assert = require("node:assert/strict");

const { callMlApi, applyServicePolicyToFeatures } = require("./mlClient");

function buildFeatures(overrides = {}) {
  return {
    service_type: "income_certificate",
    age: 28,
    gender: "male",
    caste: "obc",
    district: "raipur",
    annual_income: 600000,
    average_income_last_3_years: 610000,
    missing_documents_count: 0,
    missing_fields_count: 0,
    field_mismatch_count: 0,
    document_quality_score: 0.9,
    age_eligible: 1,
    income_eligible: 0,
    district_valid: 1,
    ...overrides
  };
}

test("Case A: income_certificate forces income_eligible=1 and removes income factor", async () => {
  process.env.ML_API_URL = "https://example.test/predict-risk";
  process.env.ML_API_PAYLOAD_MODE = "raw";

  const originalFetch = global.fetch;
  let capturedBody = null;
  global.fetch = async (_url, options) => {
    capturedBody = JSON.parse(options.body || "{}");
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        service_type: "income_certificate",
        risk_probability: 0.52,
        risk_score: 52,
        risk_level: "high",
        rejected_prediction: 1,
        threshold_used: 0.45,
        main_contributing_factors: ["income_eligible", "missing_fields"]
      })
    };
  };

  try {
    const risk = await callMlApi(buildFeatures({ income_eligible: 0 }), { serviceType: "income_certificate" });
    assert.equal(capturedBody.income_eligible, 1);
    assert.ok(Array.isArray(risk.main_contributing_factors));
    assert.ok(!risk.main_contributing_factors.includes("income_eligible"));
  } finally {
    global.fetch = originalFetch;
  }
});

test("Case B: non-income service keeps income eligibility behavior unchanged", async () => {
  process.env.ML_API_URL = "https://example.test/predict-risk";
  process.env.ML_API_PAYLOAD_MODE = "raw";

  const originalFetch = global.fetch;
  let capturedBody = null;
  global.fetch = async (_url, options) => {
    capturedBody = JSON.parse(options.body || "{}");
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        service_type: "obc_certificate",
        risk_probability: 0.66,
        risk_score: 66,
        risk_level: "high",
        rejected_prediction: 1,
        threshold_used: 0.45,
        main_contributing_factors: ["income_eligible", "missing_documents"]
      })
    };
  };

  try {
    const input = buildFeatures({ service_type: "obc_certificate", income_eligible: 0 });
    const normalizedInput = applyServicePolicyToFeatures(input, { serviceType: "obc_certificate" });
    assert.equal(normalizedInput.income_eligible, 0);

    const risk = await callMlApi(input, { serviceType: "obc_certificate" });
    assert.equal(capturedBody.income_eligible, 0);
    assert.ok(risk.main_contributing_factors.includes("income_eligible"));
  } finally {
    global.fetch = originalFetch;
  }
});