const { loadJson } = require("../../utils/dataLoader");
const { runOcrOnFile } = require("./ocrEngine");

async function runOcrExtraction({ sampleId, documentType, filePath }) {
  const mode = (process.env.OCR_MODE || "live").toLowerCase();

  if (mode === "stub") {
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

  if (!filePath) {
    return { documentType, fields: {} };
  }

  return runOcrOnFile({ filePath, documentType });
}

module.exports = { runOcrExtraction };
