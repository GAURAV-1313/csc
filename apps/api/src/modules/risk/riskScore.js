function scoreRisk(features, validation) {
  const missing = Number(features.missing_documents_count || 0);
  const missingFields = Number(features.missing_fields_count || 0);
  const mismatches = Number(features.field_mismatch_count || 0);
  const eligibility = Number(features.eligibility_flags || 0);
  const quality = Number(features.document_quality_score || 0);

  let score = 0.1;
  score += missing * 0.2;
  score += missingFields * 0.02;
  score += mismatches * 0.15;
  score += eligibility * 0.25;
  score += (1 - Math.max(0, Math.min(1, quality))) * 0.2;

  if (validation && validation.warnings && validation.warnings.length > 0) {
    score += 0.1;
  }

  score = Math.max(0, Math.min(1, score));
  const percent = Math.round(score * 100);
  const threshold = Number(process.env.ML_API_RISK_THRESHOLD || 0.5);
  const baseFactors = [];
  if (missing > 0) baseFactors.push("missing_documents");
  if (missingFields > 0) baseFactors.push("missing_fields");
  if (mismatches > 0) baseFactors.push("field_mismatch");
  if (baseFactors.length === 0) baseFactors.push("eligibility_checks");

  return {
    risk_probability: Number(score.toFixed(4)),
    risk_score: score,
    risk_level: riskLevel(score),
    score_percent: percent,
    rejected_prediction: score >= threshold ? 1 : 0,
    threshold_used: threshold,
    main_contributing_factors: baseFactors
  };
}

function applyRiskGuardrails(risk, features) {
  const base = risk && typeof risk === "object" ? { ...risk } : {};
  const missingDocs = Number(features && features.missing_documents_count ? features.missing_documents_count : 0);
  const missingFields = Number(features && features.missing_fields_count ? features.missing_fields_count : 0);

  let minimumScore = null;
  const additionalFactors = [];

  if (missingDocs > 0) {
    minimumScore = 0.75;
    additionalFactors.push("Missing mandatory documents");
  } else if (missingFields >= 5) {
    minimumScore = 0.6;
    additionalFactors.push("Multiple required fields are missing");
  }

  if (minimumScore == null) {
    return base;
  }

  const currentScore = resolveScore(base);
  const guardedScore = Math.max(currentScore, minimumScore);
  const guardedLevel = riskLevel(guardedScore);

  const existingFactors = Array.isArray(base.main_contributing_factors)
    ? base.main_contributing_factors.map((item) => String(item))
    : [];

  return {
    ...base,
    risk_score: Number(guardedScore.toFixed(4)),
    risk_probability: Number(guardedScore.toFixed(4)),
    risk_level: guardedLevel,
    rejected_prediction: true,
    main_contributing_factors: Array.from(new Set([...existingFactors, ...additionalFactors]))
  };
}

function resolveScore(risk) {
  const candidates = [risk.risk_score, risk.risk_probability, risk.score];
  for (const candidate of candidates) {
    const n = Number(candidate);
    if (!Number.isNaN(n)) {
      if (n > 1 && n <= 100) {
        return Math.max(0, Math.min(1, n / 100));
      }
      return Math.max(0, Math.min(1, n));
    }
  }
  return 0;
}

function riskLevel(score) {
  if (score <= 0.2) return "SAFE";
  if (score <= 0.5) return "MEDIUM";
  if (score <= 0.8) return "HIGH";
  return "VERY_HIGH";
}

module.exports = { scoreRisk, riskLevel, applyRiskGuardrails };
