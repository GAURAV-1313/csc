function explain({ serviceType, citizenData, validation, risk, schemes }) {
  if (process.env.LLM_MODE !== "mock") {
    return "LLM integration placeholder. Set LLM_MODE=mock for demo text.";
  }

  const warnings = (validation && validation.warnings) || [];
  const missing = (validation && validation.missingDocuments) || [];
  const schemeNames = (schemes || []).map((s) => s.scheme_name).join(", ");
  const riskScore = risk && (risk.risk_score ?? risk.score);
  const riskLevel = risk && (risk.risk_level ?? risk.level);

  return [
    `Service: ${serviceType || "Unknown"}.`,
    warnings.length ? `Issues: ${warnings.join("; ")}.` : "No rule violations detected.",
    missing.length ? `Missing documents: ${missing.join(", ")}.` : "All required documents appear present.",
    riskScore !== undefined ? `Risk score: ${riskScore} (${riskLevel}).` : "Risk not available.",
    schemeNames ? `Eligible schemes: ${schemeNames}.` : "No additional schemes found."
  ].join(" ");
}

module.exports = { explain };
