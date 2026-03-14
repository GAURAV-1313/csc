const { loadJson } = require("../../utils/dataLoader");

function recommend(citizenData) {
  const schemes = loadJson("schemes/schemes.json");
  return (schemes || []).filter((scheme) => isEligible(citizenData, scheme));
}

function isEligible(citizenData, scheme) {
  const conditions = scheme.conditions || {};
  if (conditions.min_age && Number(citizenData.age) < conditions.min_age) return false;
  if (conditions.max_age && Number(citizenData.age) > conditions.max_age) return false;
  if (conditions.gender && citizenData.gender !== conditions.gender) return false;
  if (conditions.max_income && Number(citizenData.annual_income) > conditions.max_income) return false;
  if (conditions.caste && citizenData.caste !== conditions.caste) return false;
  if (conditions.district && citizenData.district !== conditions.district) return false;
  return true;
}

module.exports = { recommend };
