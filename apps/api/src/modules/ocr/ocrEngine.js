const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
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

function normalizeLineText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function isLikelyNoiseLine(line) {
  const value = String(line || "").toLowerCase();
  if (!value) return true;
  return [
    "government of india",
    "bharat sarkar",
    "uidai",
    "aadhaar",
    "aadhar",
    "www",
    "help@uidai",
    "1947"
  ].some((token) => value.includes(token));
}

function cleanNameCandidate(line) {
  return String(line || "")
    .replace(/[^A-Za-z\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyPersonName(line) {
  const cleaned = cleanNameCandidate(line);
  if (!cleaned) return false;
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  if (words.some((w) => w.length < 2)) return false;
  const alphaChars = cleaned.replace(/[^A-Za-z]/g, "").length;
  if (alphaChars < 5) return false;
  return true;
}

async function preprocessImageForOcr(filePath) {
  try {
    const image = await loadImage(filePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      const boosted = Math.max(0, Math.min(255, (gray - 128) * 1.25 + 128));
      const bw = boosted > 145 ? 255 : 0;

      data[i] = bw;
      data[i + 1] = bw;
      data[i + 2] = bw;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toBuffer("image/png");
  } catch (_) {
    return null;
  }
}

async function loadImageAsPngBuffer(filePath) {
  try {
    const image = await loadImage(filePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    return canvas.toBuffer("image/png");
  } catch (_) {
    return null;
  }
}

function selectBestOcrText(texts, documentType) {
  const joinedType = String(documentType || "").toLowerCase();

  const scoreText = (text) => {
    const raw = String(text || "");
    if (!raw.trim()) return 0;

    const clean = normalizeText(raw);
    let score = Math.min(clean.length, 2000) / 40;

    if (joinedType.includes("aadhaar") || joinedType.includes("aadhar")) {
      if (/\b\d{4}\s?\d{4}\s?\d{4}\b/.test(clean)) score += 40;
      if (/\b(male|female|transgender)\b/i.test(clean)) score += 10;
      if (/\b(dob|date of birth)\b/i.test(clean)) score += 10;
    }

    return score;
  };

  return texts
    .map((text) => ({ text, score: scoreText(text) }))
    .sort((a, b) => b.score - a.score)[0]?.text || "";
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

function extractAadhaarFields(rawText, cleanText) {
  const fields = {};
  const lines = normalizeLineText(rawText).split("\n");

  const aadhaar = pickFirstMatch(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, cleanText);
  if (aadhaar) fields.aadhaar_number = aadhaar.replace(/\s+/g, "");

  const dob = pickFirstMatch(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/g, cleanText);
  if (dob) {
    fields.dob = dob;
  } else {
    const birthYear = cleanText.match(/\b(?:yob|year of birth)\s*[:\-]?\s*(\d{4})\b/i);
    if (birthYear) fields.birth_year = birthYear[1];
  }

  const gender = cleanText.match(/\b(male|female|transgender)\b/i);
  if (gender) fields.gender = gender[1].toLowerCase();

  const anchorIdx = lines.findIndex((line) => /\b(male|female|transgender|dob|date of birth|yob)\b/i.test(line));
  const aadhaarIdx = lines.findIndex((line) => /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(line));

  const anchorWindow = [];
  if (anchorIdx > 0) {
    anchorWindow.push(lines[anchorIdx - 1], lines[anchorIdx - 2]);
  }
  if (aadhaarIdx > 0) {
    anchorWindow.push(lines[aadhaarIdx - 1], lines[aadhaarIdx - 2]);
  }

  const candidateName = [...anchorWindow, ...lines]
    .filter(Boolean)
    .find((line) => !isLikelyNoiseLine(line) && !/\d/.test(line) && isLikelyPersonName(line));

  if (candidateName) {
    fields.name = cleanNameCandidate(candidateName);
  }

  const addressIdx = lines.findIndex((line) => /\baddress\b/i.test(line));
  if (addressIdx !== -1) {
    const address = lines.slice(addressIdx + 1, Math.min(addressIdx + 5, lines.length)).join(", ");
    if (address) fields.address = address;
  }

  fields.raw_text = normalizeLineText(rawText).slice(0, 5000);
  return fields;
}

function extractFields(text, documentType) {
  const clean = normalizeText(text);
  const docType = String(documentType || "").toLowerCase();

  if (docType.includes("aadhaar") || docType.includes("aadhar") || /\b(uidai|aadhaar|aadhar)\b/i.test(clean)) {
    return extractAadhaarFields(text, clean);
  }

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
  const supportedImageExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff", ".avif"]);
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
    if (typeof worker.setParameters === "function") {
      await worker.setParameters({
        preserve_interword_spaces: "1"
      });
    }

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
      const sourceForOcr = ext === ".avif"
        ? await loadImageAsPngBuffer(filePath)
        : filePath;
      const originalText = await extractTextFromImage(worker, sourceForOcr || filePath, filePath);
      const processedImage = await preprocessImageForOcr(filePath);
      const processedText = processedImage
        ? await extractTextFromImage(worker, processedImage, `${filePath}#processed`)
        : "";
      text = selectBestOcrText([originalText, processedText], documentType);
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[ocr] Unsupported file type for OCR: ${ext || "unknown"} (${filePath})`);
      }
      text = "";
    }
  } finally {
    await worker.terminate();
  }

  const fields = extractFields(text, documentType);
  cache[cacheKey] = fields;
  saveCache(cache);

  return {
    documentType,
    fields
  };
}

module.exports = { runOcrOnFile };
