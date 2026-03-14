const { parseServiceRequirements, getAllowedDistricts, normalizeDistrict } = require("../services/serviceRegistry");
const { usesIncomeEligibility } = require("../services/servicePolicy");

const INCOME_LIMITS = {
  income_certificate: 300000,
  obc_certificate: 300000,
  default: 300000
};

function buildRiskFeatures({ serviceType, citizenData, documents, service, validation, verification, ocrResults }) {
  const safeCitizen = citizenData || {};
  const safeDocs = Array.isArray(documents) ? documents : [];
  const safeOcr = Array.isArray(ocrResults) ? ocrResults : [];
  const req = parseServiceRequirements(service);
  const uploadedDocs = getUploadedDocTypes(safeDocs);
  const missingDocumentKeys = findMissingDocuments(uploadedDocs, req.mandatoryDocuments, req.acceptedGroups);
  const missingFieldKeys = findMissingRequiredFields(safeCitizen, req.requiredFields);

  const missingDocumentsCount = missingDocumentKeys.length;
  const missingFieldsCount = missingFieldKeys.length;

  const computedMismatchCount = countFieldMismatches(safeCitizen, safeOcr);
  const verifiedMismatchCount = normalizeNonNegativeInt(verification && verification.field_mismatch_count, 0);
  const fieldMismatchCount = Math.max(computedMismatchCount, verifiedMismatchCount);

  const documentQualityScore = computeDocumentQualityScore(safeOcr, verification);

  const age = toNumber(firstDefined(safeCitizen.age, safeCitizen.age_of_beneficiary));
  const annualIncome = toNumber(safeCitizen.annual_income);
  const averageIncome = toNumber(firstDefined(safeCitizen.average_income_last_3_years, annualIncome));
  const district = normalizeString(safeCitizen.district);

  const ageEligible = computeAgeEligibility(serviceType, req.requiredFields, age);
  const incomeEligible = computeIncomeEligibility(serviceType, req.requiredFields, annualIncome);
  const districtValid = computeDistrictEligibility(req.requiredFields, district);
  const eligibilityFlags = [ageEligible, incomeEligible, districtValid].filter((v) => v === 0).length;

  const features = {
    service_type: normalizeString(serviceType || safeCitizen.service_type || "unknown"),
    age: age == null ? 0 : age,
    gender: normalizeString(safeCitizen.gender || "unknown"),
    caste: normalizeString(firstDefined(safeCitizen.caste, safeCitizen.caste_obc, safeCitizen.category, "unknown")),
    district: district || "unknown",
    annual_income: annualIncome == null ? 0 : annualIncome,
    average_income_last_3_years: averageIncome == null ? (annualIncome == null ? 0 : annualIncome) : averageIncome,
    missing_documents_count: missingDocumentsCount,
    missing_fields_count: missingFieldsCount,
    field_mismatch_count: fieldMismatchCount,
    document_quality_score: documentQualityScore,
    age_eligible: ageEligible,
    income_eligible: incomeEligible,
    district_valid: districtValid,
    eligibility_flags: eligibilityFlags
  };

  return {
    features,
    summary: {
      service_type: features.service_type,
      uploaded_documents: uploadedDocs,
      missing_mandatory_documents: missingDocumentKeys,
      missing_required_fields: missingFieldKeys,
      missing_documents_count: features.missing_documents_count,
      missing_fields_count: features.missing_fields_count,
      field_mismatch_count: features.field_mismatch_count,
      document_quality_score: features.document_quality_score,
      eligibility: {
        age_eligible: features.age_eligible,
        income_eligible: features.income_eligible,
        district_valid: features.district_valid
      },
      schema_required_fields: req.requiredFields,
      schema_mandatory_documents: req.mandatoryDocuments
    }
  };
}

function getUploadedDocTypes(documents) {
  return (documents || [])
    .map((doc) => normalizeString(doc && (doc.documentType || doc.document_type)).toLowerCase())
    .filter(Boolean);
}

function findMissingDocuments(uploadedDocTypes, mandatory, acceptedGroups) {
  if (!Array.isArray(mandatory) || mandatory.length === 0) return [];
  const provided = (uploadedDocTypes || []).map((doc) => normalizeDocKey(doc));
  const providedSet = new Set(provided);

  const missing = [];

  mandatory.forEach((docKey) => {
    const normalizedKey = normalizeDocKey(docKey);
    if (!normalizedKey) return;

    if (providedSet.has(normalizedKey)) return;
    if (hasFuzzyMatch(normalizedKey, provided)) return;

    const accepted = Array.isArray(acceptedGroups && acceptedGroups[docKey]) ? acceptedGroups[docKey] : [];
    const satisfiedByGroup = accepted.some((alt) => {
      const altKey = normalizeDocKey(alt);
      if (!altKey) return false;
      return providedSet.has(altKey) || hasFuzzyMatch(altKey, provided);
    });
    if (!satisfiedByGroup) {
      missing.push(docKey);
    }
  });

  return missing;
}

function normalizeDocKey(value) {
  if (value == null) return "";
  return String(value)
    .toLowerCase()
    .replace(/[_/]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasFuzzyMatch(target, providedKeys) {
  if (!target) return false;
  const targetTokens = new Set(target.split(" ").filter(Boolean));
  if (targetTokens.size === 0) return false;
  return providedKeys.some((candidate) => {
    const candidateTokens = new Set(candidate.split(" ").filter(Boolean));
    if (candidateTokens.size === 0) return false;
    let overlap = 0;
    targetTokens.forEach((token) => {
      if (candidateTokens.has(token)) overlap += 1;
    });
    return overlap / Math.max(targetTokens.size, candidateTokens.size) >= 0.5;
  });
}

function findMissingRequiredFields(citizenData, requiredFields) {
  if (!Array.isArray(requiredFields) || requiredFields.length === 0) return [];
  const missing = [];
  requiredFields.forEach((key) => {
    const value = citizenData ? citizenData[key] : undefined;
    if (value === undefined || value === null || String(value).trim() === "") {
      missing.push(key);
    }
  });
  return missing;
}

function countFieldMismatches(citizenData, ocrResults) {
  if (!Array.isArray(ocrResults) || ocrResults.length === 0) {
    return 0;
  }

  const hasAnyOcrFields = ocrResults.some((ocr) => ocr && ocr.fields && Object.keys(ocr.fields).length > 0);
  if (!hasAnyOcrFields) {
    return 0;
  }

  const comparisonMap = [
    { formKey: "applicant_name", ocrKeys: ["name", "applicant_name"] },
    { formKey: "beneficiary_guardian_name", ocrKeys: ["name", "guardian_name"] },
    { formKey: "address", ocrKeys: ["address"] },
    { formKey: "annual_income", ocrKeys: ["income", "annual_income"] },
    { formKey: "date_of_birth", ocrKeys: ["dob", "date_of_birth"] }
  ];

  let mismatches = 0;

  comparisonMap.forEach(({ formKey, ocrKeys }) => {
    const source = citizenData ? citizenData[formKey] : undefined;
    if (source === undefined || source === null || String(source).trim() === "") {
      return;
    }

    const matched = (ocrResults || []).some((ocr) => {
      const fields = (ocr && ocr.fields) || {};
      return ocrKeys.some((ocrKey) => {
        const target = fields[ocrKey];
        if (target === undefined || target === null || String(target).trim() === "") {
          return false;
        }
        return softMatch(source, target, formKey);
      });
    });

    if (!matched) mismatches += 1;
  });

  return mismatches;
}

function computeDocumentQualityScore(ocrResults, verification) {
  const explicitScores = [];

  (ocrResults || []).forEach((result) => {
    const confidence = toNumber(result && result.confidence);
    if (confidence != null) {
      explicitScores.push(clamp(confidence, 0, 1));
      return;
    }

    const numericQuality = toNumber(result && result.quality_score);
    if (numericQuality != null) {
      explicitScores.push(clamp(numericQuality, 0, 1));
      return;
    }

    const mapped = scanQualityToScore(result && result.scan_quality);
    if (mapped != null) {
      explicitScores.push(mapped);
    }
  });

  if (explicitScores.length > 0) {
    const avg = explicitScores.reduce((acc, value) => acc + value, 0) / explicitScores.length;
    return Number(avg.toFixed(4));
  }

  const fallback = toNumber(verification && verification.document_quality_score);
  if (fallback != null) {
    return Number(clamp(fallback, 0, 1).toFixed(4));
  }

  return 0.5;
}

function computeAgeEligibility(serviceType, requiredFields, age) {
  const mustHaveAge = requiredFields.includes("age") || requiredFields.includes("age_of_beneficiary")
    || serviceType === "income_certificate";
  if (!mustHaveAge) return 1;
  if (age == null) return 0;
  return age >= 18 ? 1 : 0;
}

function computeIncomeEligibility(serviceType, requiredFields, annualIncome) {
  if (!usesIncomeEligibility(serviceType)) {
    return 1;
  }

  const requiresIncome = requiredFields.includes("annual_income") || serviceType === "income_certificate" || serviceType === "obc_certificate";
  if (!requiresIncome) return 1;
  if (annualIncome == null) return 0;
  const limit = INCOME_LIMITS[serviceType] || INCOME_LIMITS.default;
  return annualIncome <= limit ? 1 : 0;
}

function computeDistrictEligibility(requiredFields, district) {
  const requiresDistrict = requiredFields.includes("district");
  if (!requiresDistrict) return 1;
  if (!district) return 0;

  const normalized = normalizeDistrict(district);
  if (!normalized) return 0;
  const allowed = new Set(getAllowedDistricts());
  return allowed.has(normalized) ? 1 : 0;
}

function scanQualityToScore(value) {
  if (value == null) return null;
  const key = String(value).trim().toLowerCase();
  if (key === "high") return 0.9;
  if (key === "medium") return 0.7;
  if (key === "low") return 0.4;
  if (key === "poor") return 0.2;
  return null;
}

function softMatch(a, b, key) {
  const normalizedA = normalizeLoose(a);
  const normalizedB = normalizeLoose(b);
  if (!normalizedA || !normalizedB) return false;

  const loweredKey = String(key || "").toLowerCase();
  if (loweredKey.includes("income")) {
    const numericA = toNumber(String(a).replace(/[^0-9.]/g, ""));
    const numericB = toNumber(String(b).replace(/[^0-9.]/g, ""));
    if (numericA != null && numericB != null) {
      return Math.abs(numericA - numericB) <= Math.max(1, numericA * 0.02);
    }
  }

  if (loweredKey.includes("date") || loweredKey.includes("dob")) {
    const dateA = normalizeDate(a);
    const dateB = normalizeDate(b);
    if (dateA && dateB) {
      return dateA === dateB;
    }
  }

  return normalizedA === normalizedB || tokenOverlap(normalizedA, normalizedB) >= 0.7;
}

function normalizeLoose(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDate(value) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  const date = new Date(parsed);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function tokenOverlap(a, b) {
  const setA = new Set(String(a).split(" ").filter(Boolean));
  const setB = new Set(String(b).split(" ").filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let same = 0;
  setA.forEach((token) => {
    if (setB.has(token)) same += 1;
  });
  return same / Math.max(setA.size, setB.size);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function normalizeString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeNonNegativeInt(value, fallback) {
  const n = toNumber(value);
  if (n == null) return fallback;
  return Math.max(0, Math.round(n));
}

function toNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n;
}

module.exports = {
  buildRiskFeatures
};
