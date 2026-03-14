const { buildRiskFeatures } = require("../risk/featureEngineering");

function extractFeatures({ serviceType, citizenData, documents, service, validation, verification, ocrResults }) {
  const { features } = buildRiskFeatures({
    serviceType,
    citizenData,
    documents,
    service,
    validation,
    verification,
    ocrResults
  });
  return features;
}

module.exports = { extractFeatures };
