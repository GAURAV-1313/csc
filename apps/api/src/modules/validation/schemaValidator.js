function validateAgainstSchema(schema, citizenData) {
  const errors = [];
  if (!schema || !schema.sections) {
    return { errors };
  }

  schema.sections.forEach((section) => {
    (section.fields || []).forEach((field) => {
      const value = citizenData ? citizenData[field.key] : undefined;
      if (field.required && (value === undefined || value === null || value === "")) {
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

  if (field.key && field.key.includes("pin_code")) {
    const pin = String(value).trim();
    if (!/^\d{6}$/.test(pin)) {
      return `Invalid pin code for ${field.key}. Expected 6 digits.`;
    }
  }

  if (field.enum && Array.isArray(field.enum)) {
    if (!field.enum.includes(value)) {
      return `Invalid value for ${field.key}. Expected one of: ${field.enum.join(", ")}.`;
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
    if (field.min !== undefined && numeric < Number(field.min)) {
      return `Value for ${field.key} must be >= ${field.min}.`;
    }
    if (field.max !== undefined && numeric > Number(field.max)) {
      return `Value for ${field.key} must be <= ${field.max}.`;
    }
  }

  if (field.type === "string") {
    const str = String(value);
    if (field.min_length !== undefined && str.length < Number(field.min_length)) {
      return `Value for ${field.key} must be at least ${field.min_length} characters.`;
    }
    if (field.max_length !== undefined && str.length > Number(field.max_length)) {
      return `Value for ${field.key} must be at most ${field.max_length} characters.`;
    }
  }

  if (field.type === "date") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      const now = Date.now();
      const key = field.key || "";
      if (key.includes("date_of_birth") || key.includes("dob")) {
        if (parsed > now) {
          return `Invalid date for ${field.key}. Cannot be in the future.`;
        }
      }
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
