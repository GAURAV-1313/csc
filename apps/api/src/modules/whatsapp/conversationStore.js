const fs = require("fs");
const path = require("path");
const { repoRoot } = require("../../utils/dataLoader");

function conversationsPath() {
  return path.resolve(repoRoot(), "data", "whatsapp", "conversations.json");
}

function prechecksPath() {
  return path.resolve(repoRoot(), "data", "whatsapp", "prechecks.json");
}

function ensureDataDir() {
  const dir = path.resolve(repoRoot(), "data", "whatsapp");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(conversationsPath())) {
    fs.writeFileSync(conversationsPath(), JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(prechecksPath())) {
    fs.writeFileSync(prechecksPath(), JSON.stringify([], null, 2));
  }
}

function readConversations() {
  ensureDataDir();
  const raw = fs.readFileSync(conversationsPath(), "utf-8");
  return JSON.parse(raw);
}

function writeConversations(list) {
  ensureDataDir();
  fs.writeFileSync(conversationsPath(), JSON.stringify(list, null, 2));
}

function readPrechecks() {
  ensureDataDir();
  const raw = fs.readFileSync(prechecksPath(), "utf-8");
  return JSON.parse(raw);
}

function writePrechecks(list) {
  ensureDataDir();
  fs.writeFileSync(prechecksPath(), JSON.stringify(list, null, 2));
}

function getConversation(phoneNumber) {
  const list = readConversations();
  return list.find((c) => c.phone_number === phoneNumber) || null;
}

function saveConversation(conversation) {
  const list = readConversations();
  const idx = list.findIndex((c) => c.phone_number === conversation.phone_number);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...conversation, updated_at: new Date().toISOString() };
  } else {
    list.push({ ...conversation, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }
  writeConversations(list);
  return conversation;
}

function deleteConversation(phoneNumber) {
  const list = readConversations();
  const filtered = list.filter((c) => c.phone_number !== phoneNumber);
  writeConversations(filtered);
}

function savePrecheckRecord(record) {
  const list = readPrechecks();
  const idx = list.findIndex((r) => r.reference_id === record.reference_id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...record, updated_at: new Date().toISOString() };
  } else {
    list.push({ ...record, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }
  writePrechecks(list);
  return record;
}

function getPrecheckByReferenceId(referenceId) {
  const list = readPrechecks();
  return list.find((r) => r.reference_id === referenceId) || null;
}

module.exports = {
  getConversation,
  saveConversation,
  deleteConversation,
  savePrecheckRecord,
  getPrecheckByReferenceId
};
