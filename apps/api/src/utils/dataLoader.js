const fs = require("fs");
const path = require("path");

const cache = new Map();

function repoRoot() {
  return path.resolve(__dirname, "..", "..", "..", "..");
}

function loadJson(relativePath) {
  const fullPath = path.resolve(repoRoot(), "data", relativePath);
  if (cache.has(fullPath)) {
    return cache.get(fullPath);
  }
  const raw = fs.readFileSync(fullPath, "utf-8");
  const parsed = JSON.parse(raw);
  cache.set(fullPath, parsed);
  return parsed;
}

module.exports = { loadJson, repoRoot };
