function extractFeatures({ serviceType, citizenData, validation, verification }) {
  const missingDocs = (validation && validation.missingDocuments) || [];
  const failedRules = (validation && validation.failedRules) || [];
  const schemaErrors = (validation && validation.schemaErrors) || [];
  const eligibilityFlag = failedRules.length > 0 ? 1 : 0;

  const age = Number(citizenData && (citizenData.age || citizenData.age_of_beneficiary));
  const annualIncome = Number(citizenData && citizenData.annual_income);
  const averageIncome = Number(citizenData && citizenData.average_income_last_3_years);
  const district = citizenData && citizenData.district ? citizenData.district : null;

  const missingFieldsCount = schemaErrors.filter((msg) => String(msg).includes("Missing required field")).length;

  return {
    service_type: serviceType || "unknown",
    age: Number.isNaN(age) ? null : age,
    gender: (citizenData && citizenData.gender) || null,
    caste: (citizenData && (citizenData.caste || citizenData.caste_obc || citizenData.category)) || null,
    district,
    annual_income: Number.isNaN(annualIncome) ? null : annualIncome,
    average_income_last_3_years: Number.isNaN(averageIncome) ? (Number.isNaN(annualIncome) ? null : annualIncome) : averageIncome,
    missing_documents_count: missingDocs.length,
    missing_fields_count: missingFieldsCount,
    field_mismatch_count: verification ? verification.field_mismatch_count : 0,
    document_quality_score: verification ? verification.document_quality_score : 0.85,
    age_eligible: Number.isNaN(age) ? true : age >= 18,
    income_eligible: Number.isNaN(annualIncome) ? true : annualIncome <= 300000,
    district_valid: Boolean(district),
    eligibility_flags: eligibilityFlag
  };
}

module.exports = { extractFeatures };
