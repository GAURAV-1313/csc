const {
  getConversation: getJsonConversation,
  saveConversation: saveJsonConversation,
  deleteConversation: deleteJsonConversation,
  savePrecheckRecord: saveJsonPrecheckRecord,
  getPrecheckByReferenceId: getJsonPrecheckByReferenceId
} = require("./conversationStore");

const {
  getConversation: getSqliteConversation,
  saveConversation: saveSqliteConversation,
  deleteConversation: deleteSqliteConversation,
  savePrecheckRecord: saveSqlitePrecheckRecord,
  getPrecheckByReferenceId: getSqlitePrecheckByReferenceId
} = require("./conversationStoreSqlite");

function storageMode() {
  return (process.env.STORAGE_MODE || "json").toLowerCase();
}

async function getConversation(phoneNumber) {
  if (storageMode() === "sqlite") return getSqliteConversation(phoneNumber);
  return getJsonConversation(phoneNumber);
}

async function saveConversation(conversation) {
  if (storageMode() === "sqlite") return saveSqliteConversation(conversation);
  return saveJsonConversation(conversation);
}

async function deleteConversation(phoneNumber) {
  if (storageMode() === "sqlite") return deleteSqliteConversation(phoneNumber);
  return deleteJsonConversation(phoneNumber);
}

async function savePrecheckRecord(record) {
  if (storageMode() === "sqlite") return saveSqlitePrecheckRecord(record);
  return saveJsonPrecheckRecord(record);
}

async function getPrecheckByReferenceId(referenceId) {
  if (storageMode() === "sqlite") return getSqlitePrecheckByReferenceId(referenceId);
  return getJsonPrecheckByReferenceId(referenceId);
}

module.exports = {
  getConversation,
  saveConversation,
  deleteConversation,
  savePrecheckRecord,
  getPrecheckByReferenceId
};
