const test = require("node:test");
const assert = require("node:assert/strict");

const services = require("../../../../../data/services/services.json");
const { buildRiskFeatures } = require("./featureEngineering");
const { callMlApi } = require("./mlClient");

const domicileService = services.find((entry) => entry.service_type === "domicile_certificate");

function fullDomicileCitizen() {
  return {
    beneficiary_guardian_type: "father",
    beneficiary_guardian_name: "Ramesh",
    guardian_occupation: "farmer",
    place_of_birth: "Raipur",
    gender: "male",
    date_of_birth: "1998-01-01",
    address: "Raipur",
    pin_code: "492001",
    district: "raipur",
    particulars_of_stay_after_birth: "raipur since birth",
    beneficiary_business_or_service_details: "private job",
    beneficiary_education_level: "graduate",
    voter_id_available: true,
    district_name_of_beneficiary: "raipur",
    living_in_state_years: 20,
    reason_for_domicile_application: "education",
    other_details: "none",
    date: "2025-03-01",
    signature: "signed"
  };
}

function domicileDocs(includeEducation = true) {
  const docs = [
    { documentType: "affidavit" },
    { documentType: "proof_of_15_years_residence" }
  ];
  if (includeEducation) {
    docs.push({ documentType: "educational_certificate" });
  }
  return docs;
}

function installMockModelFetch() {
  const original = global.fetch;
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body || "{}");
    const probability = body.missing_documents_count > 0 ? 0.88 : (body.missing_fields_count > 0 ? 0.62 : 0.22);
    const scorePercent = Number((probability * 100).toFixed(2));
    const factors = body.missing_documents_count > 0
      ? ["missing_documents"]
      : (body.missing_fields_count > 0 ? ["missing_fields"] : ["document_quality"]);

    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        risk_probability: probability,
        risk_score: scorePercent,
        risk_level: probability >= 0.45 ? "high" : "low",
        rejected_prediction: probability >= 0.45 ? 1 : 0,
        threshold_used: 0.451725,
        main_contributing_factors: factors
      })
    };
  };

  return () => {
    global.fetch = original;
  };
}

async function assertModelFieldsPresent(features) {
  const risk = await callMlApi(features, { serviceType: "domicile_certificate" });
  assert.notEqual(risk.rejected_prediction, null);
  assert.notEqual(risk.threshold_used, null);
  assert.equal(typeof risk.threshold_used, "number");
  assert.ok(Array.isArray(risk.main_contributing_factors));
  assert.ok(risk.main_contributing_factors.length > 0);
}

test("domicile all mandatory docs + signature present", async () => {
  process.env.ML_API_URL = "https://csc-risk-model-api.onrender.com/predict-risk";
  process.env.ML_API_PAYLOAD_MODE = "raw";

  const restoreFetch = installMockModelFetch();

  try {
    const { features } = buildRiskFeatures({
      serviceType: "domicile_certificate",
      service: domicileService,
      citizenData: fullDomicileCitizen(),
      documents: domicileDocs(true),
      ocrResults: []
    });

    assert.equal(features.missing_documents_count, 0);
    assert.equal(features.missing_fields_count, 0);
    await assertModelFieldsPresent(features);
  } finally {
    restoreFetch();
  }
});

test("domicile all mandatory docs + signature missing", async () => {
  process.env.ML_API_URL = "https://csc-risk-model-api.onrender.com/predict-risk";
  process.env.ML_API_PAYLOAD_MODE = "raw";

  const restoreFetch = installMockModelFetch();

  try {
    const citizen = fullDomicileCitizen();
    delete citizen.signature;

    const { features } = buildRiskFeatures({
      serviceType: "domicile_certificate",
      service: domicileService,
      citizenData: citizen,
      documents: domicileDocs(true),
      ocrResults: []
    });

    assert.equal(features.missing_documents_count, 0);
    assert.equal(features.missing_fields_count, 1);
    await assertModelFieldsPresent(features);
  } finally {
    restoreFetch();
  }
});

test("domicile one mandatory doc missing", async () => {
  process.env.ML_API_URL = "https://csc-risk-model-api.onrender.com/predict-risk";
  process.env.ML_API_PAYLOAD_MODE = "raw";

  const restoreFetch = installMockModelFetch();

  try {
    const { features } = buildRiskFeatures({
      serviceType: "domicile_certificate",
      service: domicileService,
      citizenData: fullDomicileCitizen(),
      documents: domicileDocs(false),
      ocrResults: []
    });

    assert.equal(features.missing_documents_count, 1);
    assert.equal(features.missing_fields_count, 0);
    await assertModelFieldsPresent(features);
  } finally {
    restoreFetch();
  }
});