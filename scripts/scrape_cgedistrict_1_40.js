const fs = require("fs");
const path = require("path");

const IDS = Array.from({ length: 40 }, (_, i) => i + 1);
const PAGE_BASE = "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=";
const API_URL = "https://api-ed.cgstate.gov.in/api/application-management/edistrict2/applicationFormPreviewByServiceId?lang=en";

function stripTags(input) {
  return (input || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionByHeader(html, headerText) {
  const start = html.indexOf(headerText);
  if (start === -1) return "";
  const after = html.slice(start + headerText.length);
  const nextHeaderIdx = after.indexOf('<div class="card-header">');
  if (nextHeaderIdx === -1) return after;
  return after.slice(0, nextHeaderIdx);
}

function extractServiceName(html) {
  const m = html.match(/<h4 class="fw-bold">\s*([^<]+?)\s*<\/h4>/i);
  return m ? stripTags(m[1]) : null;
}

function extractIntro(html) {
  const block = sectionByHeader(html, "📑 Introduction");
  return stripTags(block) || null;
}

function extractDocuments(html) {
  const block = sectionByHeader(html, "📑 Required Documents");
  const out = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rm;
  while ((rm = rowRegex.exec(block))) {
    const row = rm[1];
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => stripTags(c[1]));
    if (cells.length >= 4) {
      const slNo = cells[0] || null;
      const documentType = cells[1] || null;
      const applicableDocument = cells[2] || null;
      const mandatoryRaw = (cells[3] || "").toLowerCase();
      const mandatory = mandatoryRaw.includes("yes")
        ? "Yes"
        : mandatoryRaw.includes("no")
          ? "No"
          : cells[3] || null;
      const format = cells[4] || null;
      if (documentType || applicableDocument) {
        out.push({ slNo, documentType, applicableDocument, mandatory, format });
      }
    }
  }
  return out;
}

function extractFees(html) {
  const block = sectionByHeader(html, "₹ Fee Related Information");
  const out = [];
  const rowRegex = /<div class="row[^>]*">([\s\S]*?)<\/div>/gi;
  let rm;
  while ((rm = rowRegex.exec(block))) {
    const row = rm[1];
    const cols = [...row.matchAll(/<span class="col">([\s\S]*?)<\/span>/gi)].map((c) => stripTags(c[1]));
    if (cols.length >= 2) {
      const where = cols[0] || null;
      const amount = cols[1] || null;
      const action = cols[2] || null;
      if (where || amount || action) out.push({ where, amount, action });
    }
  }
  return out;
}

function extractContact(html) {
  const block = sectionByHeader(html, "📞 Contact");
  return stripTags(block) || null;
}

function extractTimeLimit(html) {
  const block = sectionByHeader(html, "⏳ Time Limit");
  const text = stripTags(block);
  const m = text.match(/(\d+\s*Days?)/i);
  return m ? m[1] : text || null;
}

function groupFormData(rows) {
  const grouped = [];
  let current = null;

  for (const r of rows) {
    const inputTypeName = (r.inputTypeName || "").toLowerCase();
    const label = (r.attributeLabel || "").trim();

    if (!label) continue;

    if (inputTypeName.includes("section")) {
      current = { section: label, fields: [] };
      grouped.push(current);
      continue;
    }

    if (!current) {
      current = { section: "General", fields: [] };
      grouped.push(current);
    }

    current.fields.push({
      attributeId: r.attributeId || null,
      label,
      inputType: r.inputTypeName || null,
      dataType: r.inputDataTypeName || null,
      row: r.attributeRow || null,
      col: r.attributeCol || null
    });
  }

  return grouped;
}

async function getText(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function scrapeOne(id) {
  const pageUrl = `${PAGE_BASE}${id}`;
  const pageResp = await getText(pageUrl);
  const html = pageResp.text || "";

  let apiMeta = { result: null, message: null };
  let formSections = [];
  let rawFieldCount = 0;

  try {
    const apiResp = await getText(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: String(id) })
    });

    if (apiResp.ok) {
      const parsed = JSON.parse(apiResp.text || "{}");
      apiMeta = { result: parsed.result ?? null, message: parsed.message || null };
      if (Array.isArray(parsed.data)) {
        rawFieldCount = parsed.data.length;
        formSections = groupFormData(parsed.data);
      }
    } else {
      apiMeta = { result: null, message: `HTTP ${apiResp.status}` };
    }
  } catch (error) {
    apiMeta = { result: null, message: error.message };
  }

  const serviceName = extractServiceName(html);
  const introduction = extractIntro(html);
  const requiredDocuments = extractDocuments(html);
  const feeInformation = extractFees(html);
  const contact = extractContact(html);
  const timeLimit = extractTimeLimit(html);

  const available = Boolean(
    serviceName ||
    introduction ||
    requiredDocuments.length > 0 ||
    feeInformation.length > 0 ||
    contact ||
    timeLimit ||
    rawFieldCount > 0
  );

  return {
    serviceId: id,
    pageUrl,
    pageHttpStatus: pageResp.status,
    serviceName,
    introduction,
    feeInformation,
    requiredDocuments,
    contact,
    timeLimit,
    formPreview: {
      api: apiMeta,
      rawFieldCount,
      sections: formSections
    },
    available
  };
}

async function main() {
  const results = [];

  for (const id of IDS) {
    try {
      const item = await scrapeOne(id);
      results.push(item);
      console.log(`serviceId=${id} available=${item.available} fields=${item.formPreview.rawFieldCount}`);
    } catch (error) {
      results.push({
        serviceId: id,
        pageUrl: `${PAGE_BASE}${id}`,
        available: false,
        error: error.message
      });
      console.log(`serviceId=${id} ERROR=${error.message}`);
    }
  }

  const available = results.filter((r) => r.available);
  const summary = {
    generatedAt: new Date().toISOString(),
    totalRequested: IDS.length,
    totalAvailable: available.length,
    availableServiceIds: available.map((r) => r.serviceId)
  };

  const outDir = path.resolve(process.cwd(), "data", "scraped");
  fs.mkdirSync(outDir, { recursive: true });

  const fullPath = path.join(outDir, "cgedistrict_services_1_40_en.json");
  const summaryPath = path.join(outDir, "cgedistrict_services_1_40_en_summary.json");

  fs.writeFileSync(fullPath, JSON.stringify({ summary, services: results }, null, 2));
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`Saved ${fullPath}`);
  console.log(`Saved ${summaryPath}`);
  console.log(`Available ${summary.totalAvailable}/${summary.totalRequested}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
