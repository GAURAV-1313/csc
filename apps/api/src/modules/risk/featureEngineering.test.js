const test = require("node:test");
const assert = require("node:assert/strict");

const services = require("../../../../../data/services/services.json");
const { buildRiskFeatures } = require("./featureEngineering");
const { scoreRisk } = require("./riskScore");
const { inferRiskLevel } = require("./mlClient");

function service(type) {
  return services.find((entry) => entry.service_type === type);
}

test("assigns deterministic low/medium/high risk levels by threshold", () => {
  assert.equal(inferRiskLevel(0.2, 0.5), "low");
  assert.equal(inferRiskLevel(0.5, 0.5), "medium");
  assert.equal(inferRiskLevel(0.8, 0.5), "high");
});

test("income certificate complete payload keeps missing counters at zero", () => {
  const result = buildRiskFeatures({
    serviceType: "income_certificate",
    service: service("income_certificate"),
    citizenData: {
      gender: "male",
      age_of_beneficiary: 25,
      beneficiary_guardian_type: "father",
      beneficiary_guardian_name: "Ramesh",
      relation_with_applicant: "son",
      beneficiary_relative_name: "Suresh",
      caste: "OBC",
      type: "student",
      class_number: "12",
      address: "Raipur",
      pin_code: "492001",
      district: "raipur",
      business_or_service_details: "none",
      reason_for_application: "scholarship",
      annual_income: 120000,
      average_income_last_3_years: 130000,
      date: "2025-01-01",
      place: "Raipur",
      applicant_name: "Amit",
      signature: "signed"
    },
    documents: [
      { documentType: "affidavit" },
      { documentType: "form16" }
    ],
    verification: {
      field_mismatch_count: 0,
      document_quality_score: 0.95
    },
    ocrResults: [
      { confidence: 0.9 },
      { confidence: 0.95 }
    ]
  });

  assert.equal(result.features.missing_documents_count, 0);
  assert.equal(result.features.missing_fields_count, 0);
  assert.equal(result.features.age_eligible, 1);
  assert.equal(result.features.income_eligible, 1);
  assert.equal(result.features.district_valid, 1);
});

test("income certificate ignores income-limit eligibility policy", () => {
  const result = buildRiskFeatures({
    serviceType: "income_certificate",
    service: service("income_certificate"),
    citizenData: {
      gender: "male",
      age_of_beneficiary: 25,
      beneficiary_guardian_type: "father",
      beneficiary_guardian_name: "Ramesh",
      relation_with_applicant: "son",
      beneficiary_relative_name: "Suresh",
      caste: "OBC",
      type: "student",
      class_number: "12",
      address: "Raipur",
      pin_code: "492001",
      district: "raipur",
      business_or_service_details: "none",
      reason_for_application: "scholarship",
      annual_income: 900000,
      average_income_last_3_years: 900000,
      date: "2025-01-01",
      place: "Raipur",
      applicant_name: "Amit",
      signature: "signed"
    },
    documents: [
      { documentType: "affidavit" },
      { documentType: "form16" }
    ],
    verification: {
      field_mismatch_count: 0,
      document_quality_score: 0.95
    },
    ocrResults: [{ confidence: 0.9 }]
  });

  assert.equal(result.features.income_eligible, 1);
});

test("sc/st blank form with caste proof has higher risk than complete form", () => {
  const scstService = service("sc_st_certificate");

  const complete = buildRiskFeatures({
    serviceType: "sc_st_certificate",
    service: scstService,
    citizenData: {
      beneficiary_guardian_type: "father",
      beneficiary_guardian_name: "Ram",
      guardian_type_english: "father",
      guardian_name_english: "Ram",
      gender: "male",
      marital_status: "single",
      date_of_birth: "2000-01-01",
      relation_to_applicant: "self",
      caste: "gond",
      category: "st",
      caste_english: "Gond",
      category_english: "ST",
      category_number: "123",
      beneficiary_name_english: "Shyam",
      address: "Bastar",
      pin_code: "494001",
      post_box_number: "1",
      district: "bastar",
      address_english: "Bastar",
      present_permanent_same: true,
      police_station: "Bastar",
      village_or_town: "Town",
      patwari_halka_number: "12",
      tehsil: "Bastar",
      head_of_family_name: "Ram",
      relation_to_head_of_family: "son",
      guardian_residence_since_1950: "yes",
      guardian_address_details: "Bastar",
      previous_scst_certificate: "no",
      document_proof_for_scst: "yes",
      date: "2025-01-01",
      place: "Bastar",
      applicant_name: "Shyam",
      signature: "signed"
    },
    documents: [{ documentType: "caste_proof" }],
    verification: {
      field_mismatch_count: 0,
      document_quality_score: 0.9
    },
    ocrResults: [{ scan_quality: "high" }]
  });

  const blank = buildRiskFeatures({
    serviceType: "sc_st_certificate",
    service: scstService,
    citizenData: {},
    documents: [{ documentType: "caste_proof" }],
    verification: {
      field_mismatch_count: 0,
      document_quality_score: 0.6
    },
    ocrResults: [{ scan_quality: "low" }]
  });

  const completeRisk = scoreRisk(complete.features, { warnings: [] });
  const blankRisk = scoreRisk(blank.features, { warnings: [] });

  assert.equal(blank.features.missing_documents_count, 0);
  assert.ok(blank.features.missing_fields_count > complete.features.missing_fields_count);
  assert.ok(blankRisk.risk_score > completeRisk.risk_score);
});

test("no OCR payload should not create synthetic field mismatches", () => {
  const result = buildRiskFeatures({
    serviceType: "domicile_certificate",
    service: service("domicile_certificate"),
    citizenData: {
      applicant_name: "Random Name",
      address: "Some address",
      date_of_birth: "1999-09-09",
      district: "raipur"
    },
    documents: [
      { documentType: "affidavit" },
      { documentType: "proof_of_15_years_residence" },
      { documentType: "educational_certificate" },
      { documentType: "signature" }
    ],
    ocrResults: []
  });

  assert.equal(result.features.field_mismatch_count, 0);
});