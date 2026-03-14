const fs = require("fs");
const path = require("path");
const { repoRoot } = require("../../utils/dataLoader");

function dataPath() {
  return path.resolve(repoRoot(), "data", "applications", "applications.json");
}

function loadApplications(filters = {}) {
  const raw = fs.readFileSync(dataPath(), "utf-8");
  let list = JSON.parse(raw);
  if (filters.status) {
    list = list.filter((app) => app.application_status === filters.status);
  }
  if (filters.service_id) {
    list = list.filter((app) => app.service_type === filters.service_id);
  }
  if (filters.operator_id) {
    list = list.filter((app) => app.operator_id === filters.operator_id);
  }
  if (filters.offset) {
    list = list.slice(Number(filters.offset));
  }
  if (filters.limit) {
    list = list.slice(0, Number(filters.limit));
  }
  return list;
}

function saveApplication(record) {
  const list = loadApplications();
  const existingIndex = list.findIndex((app) => app.application_id === record.application_id);
  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...record };
  } else {
    list.push(record);
  }
  fs.writeFileSync(dataPath(), JSON.stringify(list, null, 2));
  return record;
}

function updateApplicationStatus(application_id, status) {
  const list = loadApplications();
  const existingIndex = list.findIndex((app) => app.application_id === application_id);
  if (existingIndex >= 0) {
    list[existingIndex].application_status = status;
    fs.writeFileSync(dataPath(), JSON.stringify(list, null, 2));
    return list[existingIndex];
  }
  return null;
}

function createDraftApplication({ serviceType, citizenData, operatorId }) {
  const record = {
    application_id: `app_${Date.now()}`,
    service_type: serviceType,
    operator_id: operatorId || "operator_demo",
    citizen_data: citizenData || {},
    application_status: "draft",
    created_at: new Date().toISOString()
  };
  saveApplication(record);
  return record;
}

function getApplicationById(application_id) {
  const list = loadApplications();
  return list.find((app) => app.application_id === application_id) || null;
}

function addDocument({ application_id, document }) {
  const list = loadApplications();
  const existingIndex = list.findIndex((app) => app.application_id === application_id);
  if (existingIndex < 0) {
    return null;
  }
  const existing = list[existingIndex];
  const docs = Array.isArray(existing.documents) ? existing.documents : [];
  docs.push(document);
  list[existingIndex] = { ...existing, documents: docs };
  fs.writeFileSync(dataPath(), JSON.stringify(list, null, 2));
  return document;
}

module.exports = { loadApplications, saveApplication, updateApplicationStatus, createDraftApplication, getApplicationById, addDocument };
