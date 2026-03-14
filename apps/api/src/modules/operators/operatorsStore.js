const { prisma } = require("../../db/client");

function storageMode() {
  return (process.env.STORAGE_MODE || "json").toLowerCase();
}

async function createOperator(payload) {
  const operator_id = payload.operator_id || `operator_${Date.now()}`;

  if (storageMode() !== "sqlite") {
    return {
      operator_id,
      name: payload.name || operator_id,
      email: payload.email || null,
      phone: payload.phone || null,
      district: payload.district || null,
      center_id: payload.center_id || null
    };
  }

  return prisma.operator.upsert({
    where: { operator_id },
    update: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      district: payload.district,
      center_id: payload.center_id
    },
    create: {
      operator_id,
      name: payload.name || operator_id,
      email: payload.email || null,
      phone: payload.phone || null,
      district: payload.district || null,
      center_id: payload.center_id || null
    }
  });
}

module.exports = { createOperator };
