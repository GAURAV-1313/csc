const fs = require("fs");
const path = require("path");

const srcPath = path.resolve(process.cwd(), "data", "scraped", "cgedistrict_services_1_40_en.json");
const outDir = path.resolve(process.cwd(), "data", "scraped");

if (!fs.existsSync(srcPath)) {
  console.error(`Source JSON not found: ${srcPath}`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(srcPath, "utf8"));
const services = Array.isArray(payload.services) ? payload.services : [];

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
  pageHttpStatus: s.pageHttpStatus ?? "",
  available: s.available ? "Yes" : "No",
  introduction: s.introduction || "",
  feeCount: Array.isArray(s.feeInformation) ? s.feeInformation.length : 0,
  feeInfo: (s.feeInformation || []).map((f) => `${f.where || ""}: ${f.amount || ""}`).join(" | "),
  documentCount: Array.isArray(s.requiredDocuments) ? s.requiredDocuments.length : 0,
  mandatoryDocumentCount: (s.requiredDocuments || []).filter((d) => (d.mandatory || "").toLowerCase() === "yes").length,
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
  "pageHttpStatus",
  "available",
  "introduction",
  "feeCount",
  "feeInfo",
  "documentCount",
  "mandatoryDocumentCount",
  "requiredDocuments",
  "contact",
  "timeLimit",
  "formSectionCount",
  "formFieldCount"
];

const fieldRows = [];
for (const s of services) {
  const sections = (s.formPreview && Array.isArray(s.formPreview.sections)) ? s.formPreview.sections : [];

  if (sections.length === 0) {
    fieldRows.push({
      serviceId: s.serviceId,
      serviceName: s.serviceName || "",
      section: "",
      fieldLabel: "",
      inputType: "",
      dataType: "",
      row: "",
      col: ""
    });
    continue;
  }

  for (const sec of sections) {
    const fields = Array.isArray(sec.fields) ? sec.fields : [];

    if (fields.length === 0) {
      fieldRows.push({
        serviceId: s.serviceId,
        serviceName: s.serviceName || "",
        section: sec.section || "",
        fieldLabel: "",
        inputType: "",
        dataType: "",
        row: "",
        col: ""
      });
      continue;
    }

    for (const f of fields) {
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

const summaryCsvPath = path.resolve(outDir, "cgedistrict_services_1_40_en_summary.csv");
const fieldsCsvPath = path.resolve(outDir, "cgedistrict_services_1_40_en_form_fields.csv");

fs.writeFileSync(summaryCsvPath, toCsv(summaryRows, summaryHeaders));
fs.writeFileSync(fieldsCsvPath, toCsv(fieldRows, fieldHeaders));

console.log(`Saved ${summaryCsvPath}`);
console.log(`Saved ${fieldsCsvPath}`);
console.log(`Summary rows: ${summaryRows.length}`);
console.log(`Field rows: ${fieldRows.length}`);
