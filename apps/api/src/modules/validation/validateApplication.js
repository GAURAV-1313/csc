const { runRules } = require("./ruleEngine");
const { validateAgainstSchema } = require("./schemaValidator");
const { validateDocuments } = require("./documentValidator");
const { loadJson } = require("../../utils/dataLoader");
const { parseServiceRequirements } = require("../services/serviceRegistry");

function runValidation({ serviceType, citizenData, documents, service }) {
  const rulesByService = loadJson("rules/rules.json");
  const rules = rulesByService[serviceType] || [];

  const required = parseServiceRequirements(service);
  const schemaErrors = validateAgainstSchema(service, citizenData || {}, required.requiredFields);
  const ruleResult = runRules(rules, citizenData || {});
  const docs = validateDocuments(service ? service.required_documents : {}, documents || []);

  const warnings = [];
  warnings.push(...schemaErrors.errors);
  warnings.push(...ruleResult.warnings);
  if (docs.missing.length > 0) {
    warnings.push(`Missing documents: ${docs.missing.join(", ")}`);
  }

  return {
    warnings,
    failedRules: ruleResult.failedRules,
    missingDocuments: docs.missing,
    schemaErrors: schemaErrors.errors,
    documentStatus: docs
  };
}

module.exports = { runValidation };
