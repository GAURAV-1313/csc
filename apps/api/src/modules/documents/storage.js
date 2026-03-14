const fs = require("fs");
const path = require("path");
const { repoRoot } = require("../../utils/dataLoader");

function ensureUploadsDir() {
  const dir = path.resolve(repoRoot(), "data", "uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function saveBufferToFile({ buffer, originalname }) {
  const uploadsDir = ensureUploadsDir();
  const safeName = originalname ? originalname.replace(/[^a-zA-Z0-9._-]/g, "_") : "upload.bin";
  const fileName = `${Date.now()}_${safeName}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function saveBase64ToFile({ base64, filename }) {
  const uploadsDir = ensureUploadsDir();
  const safeName = filename ? filename.replace(/[^a-zA-Z0-9._-]/g, "_") : "upload.bin";
  const fileName = `${Date.now()}_${safeName}`;
  const filePath = path.join(uploadsDir, fileName);
  const cleaned = base64.includes(",") ? base64.split(",")[1] : base64;
  const buffer = Buffer.from(cleaned, "base64");
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

module.exports = { saveBufferToFile, saveBase64ToFile };
