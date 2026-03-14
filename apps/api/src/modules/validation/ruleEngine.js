function evaluateRule(rule, data) {
  const value = data[rule.field];
  switch (rule.op) {
    case "gte":
      return Number(value) >= Number(rule.value);
    case "lte":
      return Number(value) <= Number(rule.value);
    case "eq":
      return value === rule.value;
    case "neq":
      return value !== rule.value;
    case "exists":
      return value !== undefined && value !== null && value !== "";
    case "numeric":
      return !Number.isNaN(Number(value));
    default:
      return true;
  }
}

function runRules(rules, data) {
  const warnings = [];
  const failedRules = [];

  (rules || []).forEach((rule) => {
    const ok = evaluateRule(rule, data);
    if (!ok) {
      warnings.push(rule.message || `Rule failed: ${rule.field} ${rule.op}`);
      failedRules.push(rule.id || rule.field);
    }
  });

  return { warnings, failedRules };
}

module.exports = { runRules };
