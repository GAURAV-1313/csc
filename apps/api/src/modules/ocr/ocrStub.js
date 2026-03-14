const { loadJson } = require("../../utils/dataLoader");

function runOcrExtraction({ sampleId, documentType }) {
  if (!sampleId) {
    return {
      documentType,
      fields: {}
    };
  }
  const samples = loadJson("samples/ocr/samples.json");
  const sample = samples[sampleId];
  return sample || { documentType, fields: {} };
}

module.exports = { runOcrExtraction };
