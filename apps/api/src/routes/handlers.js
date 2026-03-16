const { listServices, getServiceByType } = require("../modules/services/serviceSchema");
const { runValidation } = require("../modules/validation/validateApplication");
const { runOcrExtraction } = require("../modules/ocr/ocrStub");
const { scoreRisk, applyRiskGuardrails } = require("../modules/risk/riskScore");
const { callMlApi } = require("../modules/risk/mlClient");
const { buildRiskFeatures } = require("../modules/risk/featureEngineering");
const { recommend } = require("../modules/schemes/recommendSchemes");
const { explain } = require("../modules/llm/explain");
const { chatWithAssistant } = require("../modules/llm/chatAssistant");
const { analyzeUploadedDocumentAI } = require("../modules/llm/documentAnalysis");
const { buildApplication } = require("../modules/applications/applicationBuilder");
const { saveApplication, loadApplications, updateApplicationStatus, createDraftApplication, getApplicationById, addDocument } = require("../modules/applications/applicationStore");
const { saveBufferToFile, saveBase64ToFile } = require("../modules/documents/storage");
const { verifyDocuments } = require("../modules/documents/documentVerifier");
const { createOperator } = require("../modules/operators/operatorsStore");
const { loadJson } = require("../utils/dataLoader");

function buildCitizenData(application) {
  if (!application) return {};
  if (application.citizen_data) return application.citizen_data;
  if (Array.isArray(application.fields)) {
    const mapped = {};
    application.fields.forEach((field) => {
      if (!field || !field.field_name) return;
      const key = field.field_name.includes(":") ? field.field_name.split(":").slice(-1)[0] : field.field_name;
      mapped[key] = field.field_value;
    });
    return mapped;
  }
  return {};
}

async function getServices(req, res) {
  const services = await listServices();
  res.json({ services });
}

async function getServiceSchema(req, res) {
  const serviceType = req.params.serviceType;
  const service = await getServiceByType(serviceType);
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json({ service });
}

async function createOperatorAccount(req, res) {
  const payload = req.body || {};
  const operator = await createOperator(payload);
  res.json({ operator });
}

async function createApplicationDraft(req, res) {
  const payload = req.body || {};
  const { serviceType, citizenData } = payload;
  const draft = await createDraftApplication({
    serviceType,
    citizenData,
    operatorId: req.operatorId
  });
  res.json({ application_id: draft.application_id, status: draft.application_status || "draft" });
}

async function submitApplication(req, res) {
  const applicationId = req.params.applicationId;
  const updated = await updateApplicationStatus(applicationId, "submitted");
  if (!updated) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json({ application_id: applicationId, status: "submitted" });
}

async function getApplication(req, res) {
  const applicationId = req.params.applicationId;
  const application = await getApplicationById(applicationId);
  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json({ application });
}

async function extractDocument(req, res) {
  const { sampleId, documentType } = req.body || {};
  let filePath = null;

  if (req.file) {
    filePath = saveBufferToFile({ buffer: req.file.buffer, originalname: req.file.originalname });
  }

  const result = await runOcrExtraction({ sampleId, documentType, filePath });
  res.json({ ...result, filePath });
}

async function uploadApplicationDocument(req, res) {
  const applicationId = req.params.applicationId;
  const { sampleId, documentType } = req.body || {};
  let filePath = null;

  if (req.file) {
    filePath = saveBufferToFile({ buffer: req.file.buffer, originalname: req.file.originalname });
  }

  const ocrResult = await runOcrExtraction({ sampleId, documentType, filePath });
  const application = await getApplicationById(applicationId);
  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const citizenData = buildCitizenData(application);
  const verification = verifyDocuments({ citizenData, ocrResults: [ocrResult] });
  const aiDocumentAnalysis = await analyzeUploadedDocumentAI({
    filePath,
    documentType,
    ocrFields: ocrResult.fields || {},
    serviceType: application.service_type
  });

  const aiMismatch = aiDocumentAnalysis && aiDocumentAnalysis.is_match === false;
  const computedStatus = aiMismatch
    ? "format_suspect"
    : verification.field_mismatch_count > 0
      ? "mismatch_detected"
      : "verified";

  const parsedFields = Object.entries(ocrResult.fields || {}).map(([field_name, field_value]) => ({
    field_name,
    field_value
  }));

  const stored = await addDocument({
    application_id: applicationId,
    document: {
      document_id: `${applicationId}_${documentType || "doc"}_${Date.now()}`,
      document_type: documentType || "unknown",
      file_path: filePath,
      ocr_text: JSON.stringify(ocrResult.fields || {}),
      document_status: computedStatus,
      document_fields: parsedFields
    }
  });

  res.json({
    application_id: applicationId,
    document: stored,
    ocr: ocrResult,
    document_verification: verification,
    ai_document_analysis: aiDocumentAnalysis
  });
}

function persistInlineDocuments(documents) {
  return (documents || []).map((doc) => {
    if (doc.fileBase64) {
      const filePath = saveBase64ToFile({ base64: doc.fileBase64, filename: doc.fileName || `${doc.documentType}.bin` });
      return { ...doc, filePath };
    }
    return doc;
  });
}

async function validateApplication(req, res) {
  const payload = req.body || {};
  const { serviceType, citizenData, documents, application_id } = payload;

  const persistedDocs = persistInlineDocuments(documents);

  const ocrResults = await Promise.all((persistedDocs || []).map((doc) => {
    if (doc.ocrData) {
      return doc.ocrData;
    }
    return runOcrExtraction({ sampleId: doc.sampleId, documentType: doc.documentType, filePath: doc.filePath });
  }));

  const service = await getServiceByType(serviceType);
  const validation = runValidation({ serviceType, citizenData, documents: persistedDocs, service });
  const verification = verifyDocuments({ citizenData, ocrResults });

  if (verification.mismatches.length > 0) {
    validation.warnings.push("Document mismatch detected");
  }

  const { features, summary } = buildRiskFeatures({
    serviceType,
    citizenData,
    documents: persistedDocs,
    service,
    validation,
    verification,
    ocrResults
  });

  const enrichedDocs = (persistedDocs || []).map((doc, idx) => {
    const fields = (ocrResults[idx] && ocrResults[idx].fields) || {};
    return {
      ...doc,
      ocrText: JSON.stringify(fields),
      parsedFields: Object.entries(fields).map(([field_name, field_value]) => ({
        field_name,
        field_value
      }))
    };
  });

  let risk = await callMlApi(features, {
    serviceType,
    applicationId: application_id,
    citizenData
  });
  if (risk && risk.code === "VALIDATION_ERROR") {
    res.status(400).json({ error: "Invalid risk model input", details: risk.details });
    return;
  }
  if (!risk || risk.error) {
    risk = scoreRisk(features, validation);
  }
  risk = applyRiskGuardrails(risk, features);

  logRiskRequestDiagnostics({
    applicationId: application_id || "adhoc",
    serviceType,
    summary,
    engineeredPayload: features,
    finalResponse: risk
  });

  if (process.env.NODE_ENV !== "production") {
    risk.debug_summary = summary;
    logRiskSummary(application_id || "adhoc", summary, risk);
  }

  const schemes = recommend(citizenData || {});
  const explanation = explain({ serviceType, citizenData, validation, risk, schemes });

  const application = await buildApplication({
    serviceType,
    citizenData,
    documents: enrichedDocs,
    validation,
    ocrResults,
    risk,
    recommendations: schemes,
    operatorId: req.operatorId,
    verification,
    applicationId: application_id,
    status: "validated"
  });
  await saveApplication(application);
  await updateApplicationStatus(application.application_id, "validated");

  res.json({
    application_id: application.application_id,
    warnings: validation.warnings,
    missing_documents: validation.missingDocuments,
    document_verification: verification,
    risk,
    features,
    recommendations: schemes,
    explanation
  });
}

async function listApplications(req, res) {
  const { limit, offset, status, service_id, operator_id } = req.query || {};
  const list = await loadApplications({
    limit,
    offset,
    status,
    service_id,
    operator_id
  });
  res.json({ applications: list });
}

async function predictRisk(req, res) {
  const payload = req.body || {};
  const serviceType = payload.serviceType || payload.service_type;
  if (!serviceType) {
    res.status(400).json({ error: "serviceType is required" });
    return;
  }

  const service = await getServiceByType(serviceType);
  const documents = payload.documents || [];
  const ocrResults = payload.ocrResults || [];
  const citizenData = payload.citizenData || {};
  const derived = buildRiskFeatures({
    serviceType,
    citizenData,
    documents,
    service,
    verification: payload.verification,
    ocrResults
  });
  const features = mergeFeatureOverrides(derived.features, payload.features || {});

  let risk = await callMlApi(features, {
    serviceType,
    applicationId: payload.application_id,
    citizenData
  });
  if (risk && risk.code === "VALIDATION_ERROR") {
    res.status(400).json({ error: "Invalid risk model input", details: risk.details });
    return;
  }
  if (!risk || risk.error) {
    risk = scoreRisk(features, { warnings: [] });
  }
  risk = applyRiskGuardrails(risk, features);

  logRiskRequestDiagnostics({
    applicationId: payload.application_id || "adhoc",
    serviceType,
    summary: derived.summary,
    engineeredPayload: features,
    finalResponse: risk
  });

  if (process.env.NODE_ENV !== "production") {
    risk.debug_summary = derived.summary;
    logRiskSummary(payload.application_id || "adhoc", derived.summary, risk);
  }

  res.json(risk);
}

function logRiskSummary(applicationId, summary, risk) {
  console.log("[risk-summary]", {
    application_id: applicationId,
    service_type: summary.service_type,
    missing_documents_count: summary.missing_documents_count,
    missing_fields_count: summary.missing_fields_count,
    field_mismatch_count: summary.field_mismatch_count,
    document_quality_score: summary.document_quality_score,
    risk_probability: risk.risk_probability,
    risk_score: risk.risk_score,
    risk_level: risk.risk_level,
    rejected_prediction: risk.rejected_prediction,
    threshold_used: risk.threshold_used
  });
}

function logRiskRequestDiagnostics({ applicationId, serviceType, summary, engineeredPayload, finalResponse }) {
  if (process.env.NODE_ENV === "production") return;

  console.log("[risk-request]", {
    application_id: applicationId,
    service_type: serviceType,
    uploaded_docs: summary.uploaded_documents || [],
    missing_mandatory_docs: summary.missing_mandatory_documents || [],
    missing_required_fields: summary.missing_required_fields || []
  });

  console.log("[risk-engineered-payload]", {
    application_id: applicationId,
    payload: engineeredPayload
  });

  console.log("[risk-final-response]", {
    application_id: applicationId,
    response: finalResponse
  });
}

function mergeFeatureOverrides(engineered, incoming) {
  if (!incoming || typeof incoming !== "object") {
    return engineered;
  }

  const protectedKeys = new Set([
    "missing_documents_count",
    "missing_fields_count",
    "field_mismatch_count",
    "document_quality_score",
    "age_eligible",
    "income_eligible",
    "district_valid",
    "service_type",
    "age",
    "gender",
    "caste",
    "district",
    "annual_income",
    "average_income_last_3_years"
  ]);

  const merged = { ...engineered };
  Object.entries(incoming).forEach(([key, value]) => {
    if (protectedKeys.has(key)) {
      return;
    }
    merged[key] = value;
  });

  return merged;
}

async function recommendSchemes(req, res) {
  const citizenData = req.body || {};
  const schemes = recommend(citizenData);
  res.json({ recommendations: schemes });
}

async function explainRisk(req, res) {
  const payload = req.body || {};
  const result = await explain(payload);
  res.json({ explanation: result });
}

async function getRejectionAnalytics(req, res) {
  const rawRange = String((req.query && req.query.range) || "this_month").toLowerCase();
  const normalizedRange = rawRange.replace(/\s+/g, "_");

  const source = loadJson("analytics/rejections.json");
  const dataset = source[normalizedRange] || source.this_month || { districts: [] };

  res.json({
    range: normalizedRange,
    districts: Array.isArray(dataset.districts) ? dataset.districts : []
  });
}

async function chatAssistant(req, res) {
  const payload = req.body || {};
  const message = (payload.message || "").trim();
  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const language = payload.language || "en";
  const page = payload.page || "dashboard";
  const serviceType = payload.serviceType || payload.service_type;
  const applicationId = payload.applicationId || payload.application_id;
  const context = payload.context || {};

  const service = serviceType ? await getServiceByType(serviceType) : null;
  const application = applicationId ? await getApplicationById(applicationId) : null;
  const citizenData = buildCitizenData(application);

  const response = await chatWithAssistant({
    message,
    language,
    page,
    serviceType,
    applicationId,
    context: {
      ...context,
      service,
      application: application
        ? {
            application_id: application.application_id,
            service_type: application.service_type,
            application_status: application.application_status,
            citizen_data: application.citizen_data,
            documents: application.documents,
            fields: application.fields
          }
        : null,
      citizenData
    }
  });

  res.json({ reply: response });
}

module.exports = {
  getServices,
  getServiceSchema,
  createOperatorAccount,
  createApplicationDraft,
  submitApplication,
  getApplication,
  extractDocument,
  validateApplication,
  listApplications,
  predictRisk,
  getRejectionAnalytics,
  recommendSchemes,
  explainRisk,
  uploadApplicationDocument,
  chatAssistant
};
