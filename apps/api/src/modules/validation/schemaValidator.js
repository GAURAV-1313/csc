function validateAgainstSchema(schema, citizenData, requiredKeys = []) {
  const errors = [];
  if (!schema || !schema.sections) {
    return { errors };
  }

  const requiredSet = new Set((requiredKeys || []).map((key) => String(key)));

  schema.sections.forEach((section) => {
    (section.fields || []).forEach((field) => {
      const value = citizenData ? citizenData[field.key] : undefined;
      const isRequired = true;
      if (isRequired && (value === undefined || value === null || value === "")) {
        errors.push(`Missing required field: ${field.key}`);
        return;
      }
      if (value === undefined || value === null || value === "") {
        return;
      }
      if (!isTypeValid(field.type, value)) {
        errors.push(`Invalid type for ${field.key}. Expected ${field.type}.`);
        return;
      }
      const constraintError = validateConstraints(field, value);
      if (constraintError) {
        errors.push(constraintError);
      }
    });
  });

  return { errors };
}

function isTypeValid(type, value) {
  switch (type) {
    case "number":
      return !Number.isNaN(Number(value));
    case "boolean":
      return toBoolean(value) !== null;
    case "date":
      return !Number.isNaN(Date.parse(value));
    case "string":
    default:
      return typeof value === "string" && value.trim().length > 0;
  }
}

function validateConstraints(field, value) {
  if (!field) return null;

  const key = String(field.key || "").toLowerCase();
  const raw = String(value).trim();

  if (key.includes("pin_code") || key.includes("pincode") || key.includes("pin")) {
    if (!/^\d{6}$/.test(raw)) {
      return `Invalid pin code for ${field.key}. Expected 6 digits.`;
    }
  }

  if (key.includes("aadhaar") || key.includes("aadhar")) {
    if (!/^\d{12}$/.test(raw)) {
      return `Invalid Aadhaar number for ${field.key}. Expected 12 digits.`;
    }
  }

  if (key.includes("pan")) {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(raw.toUpperCase())) {
      return `Invalid PAN number for ${field.key}. Expected format: ABCDE1234F.`;
    }
  }

  if (key.includes("email")) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(raw)) {
      return `Invalid email address for ${field.key}.`;
    }
  }

  if (key.includes("mobile") || key.includes("फोन") || key.includes("phone")) {
    if (!/^\d{10}$/.test(raw)) {
      return `Invalid mobile number for ${field.key}. Expected 10 digits.`;
    }
  }

  if (key.includes("ifsc")) {
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(raw.toUpperCase())) {
      return `Invalid IFSC code for ${field.key}. Expected format like SBIN0000001.`;
    }
  }

  if (key.includes("account") || key.includes("bank_account")) {
    if (!/^\d{9,18}$/.test(raw)) {
      return `Invalid account number for ${field.key}. Expected 9-18 digits.`;
    }
  }

  if (key.includes("name")) {
    if (raw.length < 2) {
      return `Value for ${field.key} must be at least 2 characters.`;
    }
  }

  if (field.enum && Array.isArray(field.enum)) {
    if (!field.enum.includes(value)) {
      return `Invalid value for ${field.key}. Expected one of: ${field.enum.join(", ")}.`;
    }
  }

  if (field.options && Array.isArray(field.options)) {
    if (!field.options.includes(value)) {
      return `Invalid value for ${field.key}. Expected one of: ${field.options.join(", ")}.`;
    }
  }

  if (field.pattern) {
    try {
      const regex = new RegExp(field.pattern);
      if (!regex.test(String(value))) {
        return `Invalid format for ${field.key}.`;
      }
    } catch {
      return null;
    }
  }

  if (field.type === "number") {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return `Invalid number for ${field.key}.`;
    }
    if (field.min !== undefined && numeric < Number(field.min)) {
      return `Value for ${field.key} must be >= ${field.min}.`;
    }
    if (field.max !== undefined && numeric > Number(field.max)) {
      return `Value for ${field.key} must be <= ${field.max}.`;
    }
    if (key.includes("age")) {
      if (numeric < 0 || numeric > 120) {
        return `Invalid age for ${field.key}. Expected between 0 and 120.`;
      }
    }
    if (key.includes("income") && numeric < 0) {
      return `Invalid income for ${field.key}. Must be a positive number.`;
    }
  }

  if (field.type === "string" || field.type === "text" || field.type === "textarea" || field.type === "select") {
    const str = String(value);
    if (field.min_length !== undefined && str.length < Number(field.min_length)) {
      return `Value for ${field.key} must be at least ${field.min_length} characters.`;
    }
    if (field.max_length !== undefined && str.length > Number(field.max_length)) {
      return `Value for ${field.key} must be at most ${field.max_length} characters.`;
    }
    if (field.maxLength !== undefined && str.length > Number(field.maxLength)) {
      return `Value for ${field.key} must be at most ${field.maxLength} characters.`;
    }
  }

  if (field.type === "date") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      const now = Date.now();
      if (key.includes("date_of_birth") || key.includes("dob")) {
        if (parsed > now) {
          return `Invalid date for ${field.key}. Cannot be in the future.`;
        }
      }
      if (key.includes("issue") && parsed > now) {
        return `Invalid issue date for ${field.key}. Cannot be in the future.`;
      }
      if (key.includes("expiry") && parsed < now) {
        return `Invalid expiry date for ${field.key}. Must be in the future.`;
      }
    } else {
      return `Invalid date for ${field.key}.`;
    }
  }

  return null;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : null;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
    if (normalized === "1") return true;
    if (normalized === "0") return false;
  }
  return null;
}

module.exports = { validateAgainstSchema };
