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

  try {
    return await runOcrOnFile({ filePath, documentType });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[ocr] Extraction failed, returning empty OCR fields:", err.message || err);
    }
    return { documentType, fields: {} };
  }
}

module.exports = { runOcrExtraction };
