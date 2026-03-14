const { prisma } = require("./client");

async function createApplication({
  application_id,
  service_id,
  operator_id,
  citizen_name,
  district,
  application_status,
  fields
}) {
  return prisma.application.create({
    data: {
      application_id,
      service_id,
      operator_id,
      citizen_name,
      district,
      application_status,
      fields: {
        create: (fields || []).map((field) => ({
          field_id: field.field_id,
          field_name: field.field_name,
          field_value: field.field_value
        }))
      }
    },
    include: { fields: true }
  });
}

async function getFullApplication(application_id) {
  return prisma.application.findUnique({
    where: { application_id },
    include: {
      fields: true,
      documents: true,
      validations: true,
      predictions: true,
      recommendations: true
    }
  });
}

module.exports = { createApplication, getFullApplication };
