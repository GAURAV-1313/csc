function extractFeatures({ serviceType, citizenData, validation, verification }) {
  const missingDocs = (validation && validation.missingDocuments) || [];
  const eligibilityFlag = (validation && validation.failedRules && validation.failedRules.length > 0) ? 1 : 0;

  return {
    service_type: serviceType || "unknown",
    age: Number(citizenData && (citizenData.age || citizenData.age_of_beneficiary)) || null,
    district: citizenData && citizenData.district ? citizenData.district : null,
    annual_income: Number(citizenData && citizenData.annual_income) || null,
    missing_documents_count: missingDocs.length,
    field_mismatch_count: verification ? verification.field_mismatch_count : 0,
    document_quality_score: verification ? verification.document_quality_score : 0.85,
    eligibility_flags: eligibilityFlag
  };
}

module.exports = { extractFeatures };
