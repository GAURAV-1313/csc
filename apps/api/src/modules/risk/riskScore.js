function scoreRisk(features, validation) {
  const missing = Number(features.missing_documents_count || 0);
  const mismatches = Number(features.field_mismatch_count || 0);
  const eligibility = Number(features.eligibility_flags || 0);

  let score = 0.1;
  score += missing * 0.2;
  score += mismatches * 0.15;
  score += eligibility * 0.4;

  if (validation && validation.warnings && validation.warnings.length > 0) {
    score += 0.1;
  }

  score = Math.max(0, Math.min(1, score));
  const percent = Math.round(score * 100);

  return {
    risk_score: score,
    risk_level: riskLevel(score),
    score_percent: percent
  };
}

function riskLevel(score) {
  if (score <= 0.2) return "SAFE";
  if (score <= 0.5) return "MEDIUM";
  if (score <= 0.8) return "HIGH";
  return "VERY_HIGH";
}

module.exports = { scoreRisk, riskLevel };
