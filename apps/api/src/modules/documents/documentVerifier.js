function verifyDocuments({ citizenData, ocrResults }) {
  const mismatches = [];
  const comparisons = [];

  const mappedFields = [
    { formKey: "applicant_name", ocrKeys: ["name", "applicant_name"] },
    { formKey: "beneficiary_guardian_name", ocrKeys: ["name", "guardian_name"] },
    { formKey: "address", ocrKeys: ["address"] },
    { formKey: "annual_income", ocrKeys: ["income", "annual_income"] },
    { formKey: "date_of_birth", ocrKeys: ["dob", "date_of_birth"] },
    { formKey: "aadhaar_number", ocrKeys: ["aadhaar_number", "aadhar_number", "aadhaar", "aadhar"] },
    { formKey: "pan_number", ocrKeys: ["pan_number", "pan"] }
  ];

  mappedFields.forEach(({ formKey, ocrKeys }) => {
    const formValue = citizenData && citizenData[formKey];
    if (!formValue) {
      return;
    }
    const matched = ocrResults.some((result) => {
      if (!result || !result.fields) return false;
      const ocrValue = findOcrValue(result.fields, ocrKeys);
      if (!ocrValue) return false;
      return isMatch(formKey, formValue, ocrValue);
    });

    comparisons.push({ formKey, matched });
    if (!matched) {
      mismatches.push({ field: formKey, reason: "mismatch" });
    }
  });

  const total = comparisons.length || 1;
  const matchedCount = comparisons.filter((c) => c.matched).length;
  const qualityScore = Number((matchedCount / total).toFixed(2));

  return {
    mismatches,
    field_mismatch_count: mismatches.length,
    document_quality_score: qualityScore
  };
}

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeTokens(value) {
  return normalize(value).split(" ").filter(Boolean);
}

function tokenOverlap(a, b) {
  const setA = new Set(normalizeTokens(a));
  const setB = new Set(normalizeTokens(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let match = 0;
  setA.forEach((token) => {
    if (setB.has(token)) match += 1;
  });
  return match / Math.max(setA.size, setB.size);
}

function normalizeDate(value) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  const date = new Date(parsed);
  const yyyy = String(date.getFullYear()).padStart(4, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function findOcrValue(fields, keys) {
  if (!fields) return undefined;
  for (const key of keys) {
    if (fields[key] !== undefined && fields[key] !== null && String(fields[key]).trim() !== "") {
      return fields[key];
    }
  }
  return undefined;
}

function isMatch(formKey, formValue, ocrValue) {
  const key = String(formKey || "").toLowerCase();

  if (key.includes("date") || key.includes("dob")) {
    const a = normalizeDate(formValue);
    const b = normalizeDate(ocrValue);
    return a && b ? a === b : normalize(formValue) === normalize(ocrValue);
  }

  if (key.includes("income") || key.includes("amount")) {
    const a = Number(String(formValue).replace(/[^0-9.]/g, ""));
    const b = Number(String(ocrValue).replace(/[^0-9.]/g, ""));
    if (Number.isNaN(a) || Number.isNaN(b)) {
      return normalize(formValue) === normalize(ocrValue);
    }
    return Math.abs(a - b) <= Math.max(1, a * 0.02);
  }

  if (key.includes("address")) {
    return tokenOverlap(formValue, ocrValue) >= 0.7;
  }

  if (key.includes("aadhaar") || key.includes("aadhar")) {
    const a = String(formValue).replace(/\D/g, "");
    const b = String(ocrValue).replace(/\D/g, "");
    return a.length === 12 && b.length === 12 ? a === b : a === b;
  }

  if (key.includes("pan")) {
    const a = String(formValue).replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const b = String(ocrValue).replace(/[^A-Z0-9]/gi, "").toUpperCase();
    return a === b;
  }

  if (key.includes("name")) {
    return tokenOverlap(formValue, ocrValue) >= 0.6;
  }

  return normalize(formValue) === normalize(ocrValue);
}

module.exports = { verifyDocuments };
