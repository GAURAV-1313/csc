const SERVICE_POLICY_MAP = {
  income_certificate: {
    use_income_eligibility: false
  }
};

function getServicePolicy(serviceType) {
  const key = normalizeServiceType(serviceType);
  return {
    use_income_eligibility: true,
    ...(SERVICE_POLICY_MAP[key] || {})
  };
}

function usesIncomeEligibility(serviceType) {
  return getServicePolicy(serviceType).use_income_eligibility !== false;
}

function normalizeServiceType(serviceType) {
  return String(serviceType || "").trim().toLowerCase();
}

module.exports = {
  SERVICE_POLICY_MAP,
  getServicePolicy,
  usesIncomeEligibility,
  normalizeServiceType
};