const DEFAULT_ALLOWED_DISTRICTS = [
  "raipur",
  "durg",
  "bilaspur",
  "raigarh",
  "korba",
  "janjgir champa",
  "jashpur",
  "surguja",
  "balrampur",
  "surajpur",
  "koriya",
  "manendragarh",
  "baloda bazar",
  "gariaband",
  "mahasamund",
  "dhamtari",
  "kanker",
  "kondagaon",
  "narayanpur",
  "bastar",
  "dantewada",
  "bijapur",
  "sukma",
  "kawardha",
  "mungeli",
  "gaurela pendra marwahi"
];

function parseServiceRequirements(service) {
  if (!service || typeof service !== "object") {
    return {
      requiredFields: [],
      mandatoryDocuments: [],
      acceptedGroups: {}
    };
  }

  const requiredFields = [];
  (service.sections || []).forEach((section) => {
    (section.fields || []).forEach((field) => {
      if (!field || !field.key || !field.required) return;
      requiredFields.push(String(field.key));
    });
  });

  if (requiredFields.length === 0) {
    const fallbackKeys = [
      "applicant_name",
      "beneficiary_name",
      "beneficiary_guardian_name",
      "date_of_birth",
      "dob",
      "address",
      "district",
      "pin_code",
      "signature"
    ];
    const availableKeys = new Set(
      (service.sections || [])
        .flatMap((section) => (section.fields || []).map((field) => field && field.key))
        .filter(Boolean)
    );
    fallbackKeys.forEach((key) => {
      if (availableKeys.has(key)) {
        requiredFields.push(key);
      }
    });
  }

  const requiredDocs = service.required_documents || {};
  const mandatoryDocuments = Array.isArray(requiredDocs.mandatory) ? requiredDocs.mandatory : [];
  const acceptedGroups = requiredDocs.accepted_groups && typeof requiredDocs.accepted_groups === "object"
    ? requiredDocs.accepted_groups
    : {};

  return {
    requiredFields,
    mandatoryDocuments,
    acceptedGroups
  };
}

function getAllowedDistricts() {
  const configured = process.env.ML_ALLOWED_DISTRICTS;
  if (!configured) return DEFAULT_ALLOWED_DISTRICTS;
  return configured
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeDistrict(value) {
  if (value == null) return "";
  return String(value).trim().toLowerCase();
}

module.exports = {
  parseServiceRequirements,
  getAllowedDistricts,
  normalizeDistrict
};
