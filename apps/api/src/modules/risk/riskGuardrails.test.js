const test = require("node:test");
const assert = require("node:assert/strict");

const { applyRiskGuardrails } = require("./riskScore");

test("missing mandatory documents forces high risk and rejection", () => {
  const result = applyRiskGuardrails(
    {
      risk_score: 0.1,
      risk_probability: 0.1,
      risk_level: "low"
    },
    {
      missing_documents_count: 2,
      missing_fields_count: 0
    }
  );

  assert.equal(result.rejected_prediction, true);
  assert.ok((result.risk_score || 0) >= 0.75);
  assert.equal(String(result.risk_level).toUpperCase(), "HIGH");
  assert.ok(Array.isArray(result.main_contributing_factors));
  assert.ok(result.main_contributing_factors.includes("Missing mandatory documents"));
});

test("many missing fields force at least medium risk", () => {
  const result = applyRiskGuardrails(
    {
      risk_score: 0.2,
      risk_level: "low"
    },
    {
      missing_documents_count: 0,
      missing_fields_count: 7
    }
  );

  assert.ok((result.risk_score || 0) >= 0.6);
  assert.equal(String(result.risk_level).toUpperCase(), "HIGH");
  assert.equal(result.rejected_prediction, true);
});