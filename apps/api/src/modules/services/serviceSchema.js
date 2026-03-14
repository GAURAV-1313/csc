const { loadJson } = require("../../utils/dataLoader");
const { prisma } = require("../../db/client");

function storageMode() {
  return (process.env.STORAGE_MODE || "json").toLowerCase();
}

async function listServices() {
  if (storageMode() !== "sqlite") {
    return loadJson("services/services.json");
  }

  const schemas = await prisma.serviceSchema.findMany();
  return schemas.map((row) => JSON.parse(row.schema_json));
}

async function getServiceByType(serviceType) {
  const services = await listServices();
  return (services || []).find((s) => s.service_type === serviceType || s.service_id === serviceType);
}

async function syncSchemasFromJson() {
  if (storageMode() !== "sqlite") {
    return;
  }

  const services = loadJson("services/services.json");

  for (const service of services) {
    await prisma.service.upsert({
      where: { service_id: service.service_id },
      update: { service_name: service.service_name },
      create: {
        service_id: service.service_id,
        service_name: service.service_name,
        category: service.category || "certificate"
      }
    });

    await prisma.serviceSchema.upsert({
      where: { schema_id: `schema_${service.service_id}` },
      update: { schema_json: JSON.stringify(service) },
      create: {
        schema_id: `schema_${service.service_id}`,
        service_id: service.service_id,
        schema_json: JSON.stringify(service)
      }
    });

    if (service.required_documents) {
      const mandatory = service.required_documents.mandatory || [];
      const optional = service.required_documents.optional || [];
      const acceptedGroups = service.required_documents.accepted_groups || {};

      for (const docName of mandatory) {
        await prisma.documentRequirement.upsert({
          where: { requirement_id: `req_${service.service_id}_${docName}` },
          update: {
            document_name: docName,
            mandatory: 1,
            accepted_types: JSON.stringify(acceptedGroups[docName] || [])
          },
          create: {
            requirement_id: `req_${service.service_id}_${docName}`,
            service_id: service.service_id,
            document_name: docName,
            mandatory: 1,
            accepted_types: JSON.stringify(acceptedGroups[docName] || [])
          }
        });
      }

      for (const docName of optional) {
        await prisma.documentRequirement.upsert({
          where: { requirement_id: `req_${service.service_id}_${docName}` },
          update: {
            document_name: docName,
            mandatory: 0,
            accepted_types: JSON.stringify(acceptedGroups[docName] || [])
          },
          create: {
            requirement_id: `req_${service.service_id}_${docName}`,
            service_id: service.service_id,
            document_name: docName,
            mandatory: 0,
            accepted_types: JSON.stringify(acceptedGroups[docName] || [])
          }
        });
      }
    }
  }
}

module.exports = { listServices, getServiceByType, syncSchemasFromJson };
