const { prisma } = require("../../db/client");

async function getConversation(phoneNumber) {
  return prisma.whatsAppConversation.findUnique({ where: { phone_number: phoneNumber } });
}

async function saveConversation(conversation) {
  return prisma.whatsAppConversation.upsert({
    where: { phone_number: conversation.phone_number },
    update: {
      step: conversation.step,
      service_type: conversation.service_type,
      collected_data: JSON.stringify(conversation.collected_data || {}),
      updated_at: new Date()
    },
    create: {
      phone_number: conversation.phone_number,
      step: conversation.step,
      service_type: conversation.service_type || null,
      collected_data: JSON.stringify(conversation.collected_data || {})
    }
  });
}

async function deleteConversation(phoneNumber) {
  return prisma.whatsAppConversation.deleteMany({ where: { phone_number: phoneNumber } });
}

async function savePrecheckRecord(record) {
  return prisma.whatsAppPrecheck.upsert({
    where: { reference_id: record.reference_id },
    update: {
      phone_number: record.phone_number,
      service_type: record.service_type,
      precheck_data: JSON.stringify(record.precheck_data || {}),
      status: record.status || "completed",
      updated_at: new Date()
    },
    create: {
      reference_id: record.reference_id,
      phone_number: record.phone_number,
      service_type: record.service_type,
      precheck_data: JSON.stringify(record.precheck_data || {}),
      status: record.status || "completed"
    }
  });
}

async function getPrecheckByReferenceId(referenceId) {
  return prisma.whatsAppPrecheck.findUnique({ where: { reference_id: referenceId } });
}

module.exports = {
  getConversation,
  saveConversation,
  deleteConversation,
  savePrecheckRecord,
  getPrecheckByReferenceId
};
