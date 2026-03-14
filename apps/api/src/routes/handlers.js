const { listServices, getServiceByType } = require("../modules/services/serviceSchema");
const { runValidation } = require("../modules/validation/validateApplication");
const { runOcrExtraction } = require("../modules/ocr/ocrStub");
const { extractFeatures } = require("../modules/features/featureExtractor");
const { scoreRisk } = require("../modules/risk/riskScore");
const { callMlApi } = require("../modules/risk/mlClient");
const { recommend } = require("../modules/schemes/recommendSchemes");
const { explain } = require("../modules/llm/explain");
const { buildApplication } = require("../modules/applications/applicationBuilder");
const { saveApplication, loadApplications, updateApplicationStatus, createDraftApplication, getApplicationById, addDocument } = require("../modules/applications/applicationStore");
const { saveBufferToFile, saveBase64ToFile } = require("../modules/documents/storage");
const { verifyDocuments } = require("../modules/documents/documentVerifier");
const { createOperator } = require("../modules/operators/operatorsStore");

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

  const result = runOcrExtraction({ sampleId, documentType });
  res.json({ ...result, filePath });
}

async function uploadApplicationDocument(req, res) {
  const applicationId = req.params.applicationId;
  const { sampleId, documentType } = req.body || {};
  let filePath = null;

  if (req.file) {
    filePath = saveBufferToFile({ buffer: req.file.buffer, originalname: req.file.originalname });
  }

  const ocrResult = runOcrExtraction({ sampleId, documentType });
  const application = await getApplicationById(applicationId);
  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const citizenData = buildCitizenData(application);
  const verification = verifyDocuments({ citizenData, ocrResults: [ocrResult] });
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
      document_status: verification.field_mismatch_count > 0 ? "mismatch_detected" : "verified",
      document_fields: parsedFields
    }
  });

  res.json({
    application_id: applicationId,
    document: stored,
    ocr: ocrResult,
    document_verification: verification
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

  const ocrResults = (persistedDocs || []).map((doc) => {
    if (doc.ocrData) {
      return doc.ocrData;
    }
    return runOcrExtraction({ sampleId: doc.sampleId, documentType: doc.documentType });
  });

  const service = await getServiceByType(serviceType);
  const validation = runValidation({ serviceType, citizenData, documents: persistedDocs, service });
  const verification = verifyDocuments({ citizenData, ocrResults });

  if (verification.mismatches.length > 0) {
    validation.warnings.push("Document mismatch detected");
  }

  const features = extractFeatures({ serviceType, citizenData, validation, verification });

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

  let risk = await callMlApi(features);
  if (!risk || risk.error) {
    risk = scoreRisk(features, validation);
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
  const features = payload.features || {};
  let risk = await callMlApi(features);
  if (!risk || risk.error) {
    risk = scoreRisk(features, { warnings: [] });
  }
  res.json(risk);
}

async function recommendSchemes(req, res) {
  const citizenData = req.body || {};
  const schemes = recommend(citizenData);
  res.json({ recommendations: schemes });
}

async function explainRisk(req, res) {
  const payload = req.body || {};
  const result = explain(payload);
  res.json({ explanation: result });
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
  recommendSchemes,
  explainRisk,
  uploadApplicationDocument
};
