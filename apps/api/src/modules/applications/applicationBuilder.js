const { getServiceByType } = require("../services/serviceSchema");

async function buildApplication({ serviceType, citizenData, documents, validation, ocrResults, risk, recommendations, operatorId, verification, applicationId, status }) {
  const service = await getServiceByType(serviceType);
  return {
    application_id: applicationId || `app_${Date.now()}`,
    service_type: serviceType,
    service_name: service ? service.service_name : "Unknown",
    operator_id: operatorId || "operator_demo",
    citizen_data: citizenData || {},
    documents: documents || [],
    ocr_results: ocrResults || [],
    validation: validation || {},
    document_verification: verification || {},
    risk: risk || {},
    recommendations: recommendations || [],
    application_status: status || "draft",
    created_at: new Date().toISOString()
  };
}

module.exports = { buildApplication };
