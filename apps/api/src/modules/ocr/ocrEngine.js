const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { createCanvas } = require("@napi-rs/canvas");
const { createWorker } = require("tesseract.js");
const { loadJson, saveJson } = require("../../utils/dataLoader");

const CACHE_PATH = "cache/ocr_cache.json";

let pdfjsLibPromise;

async function loadPdfJsLib() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = (async () => {
      try {
        // pdfjs-dist v4+ ships ESM builds under .mjs
        return await import("pdfjs-dist/legacy/build/pdf.mjs");
      } catch (_) {
        // Backward compatibility for older pdfjs-dist layouts
        // eslint-disable-next-line global-require
        return require("pdfjs-dist/legacy/build/pdf.js");
      }
    })();
  }
  return pdfjsLibPromise;
}

async function extractTextFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || "";
}

async function renderPdfToImages(filePath, maxPages = 3) {
  const pdfjsLib = await loadPdfJsLib();
  const buffer = fs.readFileSync(filePath);
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const images = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toBuffer("image/png"));
  }

  return images;
}

async function extractTextFromImage(worker, image, label = "unknown") {
  try {
    const { data } = await worker.recognize(image);
    return data.text || "";
  } catch (err) {
    // Do not crash the API for unreadable/corrupt images.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[ocr] Failed to read image for ${label}:`, err.message || err);
    }
    return "";
  }
}

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function getCache() {
  try {
    return loadJson(CACHE_PATH);
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    saveJson(CACHE_PATH, cache);
  } catch (err) {
    // ignore cache write errors
  }
}

function buildCacheKey(filePath, language) {
  try {
    const stat = fs.statSync(filePath);
    return `${filePath}|${stat.size}|${stat.mtimeMs}|${language}`;
  } catch {
    return `${filePath}|${language}`;
  }
}

function pickFirstMatch(regex, text) {
  const match = text.match(regex);
  return match ? match[0] : undefined;
}

function extractFields(text) {
  const clean = normalizeText(text);
  const fields = {};

  const aadhaar = pickFirstMatch(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, clean);
  if (aadhaar) fields.aadhaar_number = aadhaar.replace(/\s+/g, "");

  const pan = pickFirstMatch(/\b[A-Z]{5}\d{4}[A-Z]\b/g, clean.toUpperCase());
  if (pan) fields.pan_number = pan.toUpperCase();

  const dob = pickFirstMatch(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/g, clean);
  if (dob) fields.dob = dob;

  const nameLine = clean.split(" ").slice(0, 6).join(" ").trim();
  if (nameLine) fields.name = nameLine;

  if (clean.length > 0) fields.raw_text = clean.slice(0, 5000);

  return fields;
}

async function runOcrOnFile({ filePath, documentType }) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { documentType, fields: {} };
  }

  const ext = path.extname(filePath).toLowerCase();
  const supportedImageExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"]);
  let text = "";
  const language = (process.env.OCR_LANGUAGES || "eng").trim() || "eng";
  const cacheKey = buildCacheKey(filePath, language);
  const cache = getCache();
  if (cache[cacheKey]) {
    return {
      documentType,
      fields: cache[cacheKey]
    };
  }
  const worker = await createWorker(language);
  try {
    if (ext === ".pdf") {
      text = await extractTextFromPdf(filePath);
      if (!text || text.trim().length < 30) {
        const maxPages = Number(process.env.OCR_PDF_MAX_PAGES || 3);
        const images = await renderPdfToImages(filePath, maxPages);
        const pageTexts = [];
        for (const image of images) {
          // Use OCR for scanned PDFs
          // eslint-disable-next-line no-await-in-loop
          pageTexts.push(await extractTextFromImage(worker, image, `${filePath}#pdf_page`));
        }
        text = pageTexts.join("\n");
      }
    } else if (supportedImageExt.has(ext)) {
      text = await extractTextFromImage(worker, filePath, filePath);
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[ocr] Unsupported file type for OCR: ${ext || "unknown"} (${filePath})`);
      }
      text = "";
    }
  } finally {
    await worker.terminate();
  }

  const fields = extractFields(text);
  cache[cacheKey] = fields;
  saveCache(cache);

  return {
    documentType,
    fields
  };
}

module.exports = { runOcrOnFile };
