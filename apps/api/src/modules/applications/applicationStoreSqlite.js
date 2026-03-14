const { prisma } = require("../../db/client");
const { getServiceByType } = require("../services/serviceSchema");

function buildFieldEntries({ application_id, citizen_data, schema }) {
  const entries = [];
  const usedKeys = new Set();

  if (schema && Array.isArray(schema.sections)) {
    schema.sections.forEach((section, sectionIndex) => {
      (section.fields || []).forEach((field, fieldIndex) => {
        if (!citizen_data || !(field.key in citizen_data)) {
          return;
        }
        usedKeys.add(field.key);
        const fieldName = section && section.name ? `${section.name}:${field.key}` : field.key;
        entries.push({
          field_id: `${application_id}_${sectionIndex}_${field.key}_${fieldIndex}`,
          field_name: fieldName,
          field_value: citizen_data[field.key] == null ? null : String(citizen_data[field.key])
        });
      });
    });
  }

  Object.entries(citizen_data || {}).forEach(([key, value], idx) => {
    if (usedKeys.has(key)) return;
    entries.push({
      field_id: `${application_id}_extra_${idx}_${key}`,
      field_name: key,
      field_value: value == null ? null : String(value)
    });
  });

  return entries;
}

async function ensureOperator(operator_id) {
  if (!operator_id) return null;
  return prisma.operator.upsert({
    where: { operator_id },
    update: {},
    create: { operator_id, name: operator_id }
  });
}

async function ensureService(service_id) {
  if (!service_id) return null;
  return prisma.service.upsert({
    where: { service_id },
    update: {},
    create: { service_id, service_name: service_id }
  });
}

async function saveApplication(record) {
  const operator_id = record.operator_id || "operator_demo";
  const service_id = record.service_type;

  await ensureOperator(operator_id);
  await ensureService(service_id);

  const mismatchCount = record.document_verification ? record.document_verification.field_mismatch_count : 0;
  const schema = await getServiceByType(service_id);
  const fieldEntries = buildFieldEntries({
    application_id: record.application_id,
    citizen_data: record.citizen_data || {},
    schema
  });
  const documentEntries = (record.documents || []).map((doc, idx) => {
    const document_id = `${record.application_id}_${doc.documentType || "doc"}_${idx}`;
    return {
      document_id,
      document_type: doc.documentType || "unknown",
      file_path: doc.filePath || null,
      ocr_text: doc.ocrText || null,
      document_status: mismatchCount > 0 ? "mismatch_detected" : "verified",
      parsed_fields: Array.isArray(doc.parsedFields) ? doc.parsedFields : []
    };
  });
  const validationEntries = (record.validation && record.validation.warnings || []).map((message, idx) => ({
    validation_id: `${record.application_id}_val_${idx}`,
    validation_type: "schema",
    message,
    severity: message.toLowerCase().includes("missing") ? "error" : "warning"
  }));
  const recommendationEntries = (record.recommendations || []).map((scheme, idx) => ({
    recommendation_id: `${record.application_id}_rec_${idx}`,
    scheme_name: scheme.scheme_name || scheme.name || "scheme",
    reason: scheme.reason || null
  }));
  const predictionEntry = record.risk ? {
    prediction_id: `${record.application_id}_pred`,
    application_id: record.application_id,
    risk_score: record.risk.risk_score ?? record.risk.score ?? null,
    risk_level: record.risk.risk_level ?? record.risk.level ?? null,
    model_version: record.risk.model_version || "external"
  } : null;

  return prisma.$transaction(async (tx) => {
    await tx.application.upsert({
      where: { application_id: record.application_id },
      update: {
        citizen_name: record.citizen_data && record.citizen_data.applicant_name,
        district: record.citizen_data && record.citizen_data.district,
        application_status: record.application_status || "validated",
        updated_at: new Date()
      },
      create: {
        application_id: record.application_id,
        service_id,
        operator_id,
        citizen_name: record.citizen_data && record.citizen_data.applicant_name,
        district: record.citizen_data && record.citizen_data.district,
        application_status: record.application_status || "validated"
      }
    });

    await tx.applicationField.deleteMany({ where: { application_id: record.application_id } });
    if (fieldEntries.length > 0) {
      await tx.applicationField.createMany({ data: fieldEntries.map((entry) => ({
        ...entry,
        application_id: record.application_id
      })) });
    }

    await tx.document.deleteMany({ where: { application_id: record.application_id } });
    if (documentEntries.length > 0) {
      await tx.document.createMany({ data: documentEntries.map((doc) => ({
        document_id: doc.document_id,
        application_id: record.application_id,
        document_type: doc.document_type,
        file_path: doc.file_path,
        ocr_text: doc.ocr_text,
        document_status: doc.document_status
      })) });
    }

    await tx.documentField.deleteMany({
      where: { document: { application_id: record.application_id } }
    });
    const documentFieldEntries = [];
    documentEntries.forEach((doc) => {
      (doc.parsed_fields || []).forEach((field, idx) => {
        documentFieldEntries.push({
          field_id: `${doc.document_id}_${idx}_${field.field_name || "field"}`,
          document_id: doc.document_id,
          field_name: field.field_name,
          field_value: field.field_value == null ? null : String(field.field_value)
        });
      });
    });
    if (documentFieldEntries.length > 0) {
      await tx.documentField.createMany({ data: documentFieldEntries });
    }

    await tx.validationLog.deleteMany({ where: { application_id: record.application_id } });
    if (validationEntries.length > 0) {
      await tx.validationLog.createMany({ data: validationEntries.map((log) => ({
        ...log,
        application_id: record.application_id
      })) });
    }

    await tx.mlPrediction.deleteMany({ where: { application_id: record.application_id } });
    if (predictionEntry) {
      await tx.mlPrediction.create({ data: predictionEntry });
    }

    await tx.schemeRecommendation.deleteMany({ where: { application_id: record.application_id } });
    if (recommendationEntries.length > 0) {
      await tx.schemeRecommendation.createMany({ data: recommendationEntries.map((rec) => ({
        ...rec,
        application_id: record.application_id
      })) });
    }

    return tx.application.findUnique({
      where: { application_id: record.application_id },
      include: {
        fields: true,
        documents: { include: { fields: true } },
        validations: true,
        predictions: true,
        recommendations: true
      }
    });
  });
}

async function loadApplications(filters = {}) {
  const take = filters.limit ? Number(filters.limit) : undefined;
  const skip = filters.offset ? Number(filters.offset) : undefined;
  const where = {};
  if (filters.status) where.application_status = filters.status;
  if (filters.service_id) where.service_id = filters.service_id;
  if (filters.operator_id) where.operator_id = filters.operator_id;

  return prisma.application.findMany({
    where,
    take,
    skip,
    orderBy: { created_at: "desc" },
    include: {
      fields: true,
      documents: { include: { fields: true } },
      validations: true,
      predictions: true,
      recommendations: true
    }
  });
}

async function updateApplicationStatus(application_id, status) {
  const result = await prisma.application.updateMany({
    where: { application_id },
    data: { application_status: status, updated_at: new Date() }
  });
  if (result.count === 0) return null;
  return prisma.application.findUnique({ where: { application_id } });
}

async function createDraftApplication({ serviceType, citizenData, operatorId }) {
  const application_id = `app_${Date.now()}`;
  await ensureOperator(operatorId || "operator_demo");
  await ensureService(serviceType);

  const schema = await getServiceByType(serviceType);
  const fieldEntries = buildFieldEntries({
    application_id,
    citizen_data: citizenData || {},
    schema
  });

  return prisma.application.create({
    data: {
      application_id,
      service_id: serviceType,
      operator_id: operatorId || "operator_demo",
      citizen_name: citizenData && citizenData.applicant_name,
      district: citizenData && citizenData.district,
      application_status: "draft",
      fields: fieldEntries.length > 0 ? { create: fieldEntries } : undefined
    }
  });
}

async function getApplicationById(application_id) {
  return prisma.application.findUnique({
    where: { application_id },
    include: {
      fields: true,
      documents: { include: { fields: true } },
      validations: true,
      predictions: true,
      recommendations: true
    }
  });
}

async function addDocument({ application_id, document }) {
  if (!application_id || !document) return null;
  const created = await prisma.document.create({
    data: {
      document_id: document.document_id || `${application_id}_${document.document_type || "doc"}_${Date.now()}`,
      application_id,
      document_type: document.document_type || "unknown",
      file_path: document.file_path || null,
      ocr_text: document.ocr_text || null,
      document_status: document.document_status || null
    }
  });
  if (Array.isArray(document.document_fields) && document.document_fields.length > 0) {
    await prisma.documentField.createMany({
      data: document.document_fields.map((field, idx) => ({
        field_id: `${created.document_id}_${idx}_${field.field_name || "field"}`,
        document_id: created.document_id,
        field_name: field.field_name,
        field_value: field.field_value == null ? null : String(field.field_value)
      }))
    });
  }
  await prisma.application.update({
    where: { application_id },
    data: { updated_at: new Date() }
  });
  return created;
}

module.exports = { saveApplication, loadApplications, updateApplicationStatus, createDraftApplication, getApplicationById, addDocument };
