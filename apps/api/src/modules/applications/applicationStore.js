const {
  saveApplication: saveJson,
  loadApplications: loadJson,
  updateApplicationStatus: updateJsonStatus,
  createDraftApplication: createJsonDraft,
  getApplicationById: getJsonById,
  addDocument: addJsonDocument
} = require("./applicationStoreJson");
const {
  saveApplication: saveSqlite,
  loadApplications: loadSqlite,
  updateApplicationStatus: updateSqliteStatus,
  createDraftApplication: createSqliteDraft,
  getApplicationById: getSqliteById,
  addDocument: addSqliteDocument
} = require("./applicationStoreSqlite");

function storageMode() {
  return (process.env.STORAGE_MODE || "json").toLowerCase();
}

async function saveApplication(record) {
  if (storageMode() === "sqlite") {
    return saveSqlite(record);
  }
  return saveJson(record);
}

async function loadApplications(filters) {
  if (storageMode() === "sqlite") {
    return loadSqlite(filters);
  }
  return loadJson(filters);
}

async function updateApplicationStatus(application_id, status) {
  if (storageMode() === "sqlite") {
    return updateSqliteStatus(application_id, status);
  }
  return updateJsonStatus(application_id, status);
}

async function createDraftApplication(payload) {
  if (storageMode() === "sqlite") {
    return createSqliteDraft(payload);
  }
  return createJsonDraft(payload);
}

async function getApplicationById(application_id) {
  if (storageMode() === "sqlite") {
    return getSqliteById(application_id);
  }
  return getJsonById(application_id);
}

async function addDocument(payload) {
  if (storageMode() === "sqlite") {
    return addSqliteDocument(payload);
  }
  return addJsonDocument(payload);
}

module.exports = { saveApplication, loadApplications, updateApplicationStatus, createDraftApplication, getApplicationById, addDocument };
