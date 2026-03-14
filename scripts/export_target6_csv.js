const fs = require("fs");
const path = require("path");

const src = path.resolve("data/scraped/cgedistrict_services_1_40_en.json");
const outDir = path.resolve("data/scraped");

const targetIds = new Set([1, 4, 5, 6, 7, 40]);

const payload = JSON.parse(fs.readFileSync(src, "utf8"));
const services = (payload.services || []).filter((s) => targetIds.has(Number(s.serviceId)));

function csvEscape(value) {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

const summaryRows = services.map((s) => ({
  serviceId: s.serviceId,
  serviceName: s.serviceName || "",
  pageUrl: s.pageUrl || "",
  introduction: s.introduction || "",
  feeInfo: (s.feeInformation || []).map((f) => `${f.where || ""}: ${f.amount || ""}`).join(" | "),
  requiredDocuments: (s.requiredDocuments || []).map((d) => `${d.documentType || ""} -> ${d.applicableDocument || ""} (${d.mandatory || ""})`).join(" | "),
  contact: s.contact || "",
  timeLimit: s.timeLimit || "",
  formSectionCount: (s.formPreview && Array.isArray(s.formPreview.sections)) ? s.formPreview.sections.length : 0,
  formFieldCount: (s.formPreview && s.formPreview.rawFieldCount) || 0
}));

const summaryHeaders = [
  "serviceId",
  "serviceName",
  "pageUrl",
  "introduction",
  "feeInfo",
  "requiredDocuments",
  "contact",
  "timeLimit",
  "formSectionCount",
  "formFieldCount"
];

const fieldRows = [];
for (const s of services) {
  const sections = (s.formPreview && Array.isArray(s.formPreview.sections)) ? s.formPreview.sections : [];
  for (const sec of sections) {
    for (const f of sec.fields || []) {
      fieldRows.push({
        serviceId: s.serviceId,
        serviceName: s.serviceName || "",
        section: sec.section || "",
        fieldLabel: f.label || "",
        inputType: f.inputType || "",
        dataType: f.dataType || "",
        row: f.row || "",
        col: f.col || ""
      });
    }
  }
}

const fieldHeaders = ["serviceId", "serviceName", "section", "fieldLabel", "inputType", "dataType", "row", "col"];

fs.mkdirSync(outDir, { recursive: true });

const summaryPath = path.join(outDir, "cgedistrict_target6_summary.csv");
const fieldsPath = path.join(outDir, "cgedistrict_target6_form_fields.csv");

fs.writeFileSync(summaryPath, toCsv(summaryRows, summaryHeaders));
fs.writeFileSync(fieldsPath, toCsv(fieldRows, fieldHeaders));

console.log(`Saved ${summaryPath}`);
console.log(`Saved ${fieldsPath}`);
console.log(`Services exported: ${services.length}`);
console.log("Service list:", services.map((s) => `${s.serviceId}-${s.serviceName}`).join(" | "));
