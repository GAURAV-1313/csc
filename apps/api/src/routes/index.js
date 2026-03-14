const {
  getServices,
  getServiceSchema,
  createOperatorAccount,
  createApplicationDraft,
  submitApplication,
  getApplication,
  validateApplication,
  extractDocument,
  predictRisk,
  recommendSchemes,
  explainRisk,
  listApplications,
  uploadApplicationDocument
} = require("./handlers");
const { whatsappWebhookVerify, whatsappWebhook, whatsappLaunchConfig, precheckStatus } = require("./whatsapp");

function registerRoutes(app, upload) {
  app.get("/services", getServices);
  app.get("/services/:serviceType", getServiceSchema);
  app.get("/applications", listApplications);
  app.get("/applications/:applicationId", getApplication);
  app.post("/operators", createOperatorAccount);
  app.post("/applications", createApplicationDraft);
  app.post("/applications/:applicationId/documents", upload.single("file"), uploadApplicationDocument);
  app.post("/applications/:applicationId/submit", submitApplication);
  app.post("/extract-document", upload.single("file"), extractDocument);
  app.post("/validate-application", validateApplication);
  app.post("/predict-risk", predictRisk);
  app.post("/recommend-schemes", recommendSchemes);
  app.post("/explain", explainRisk);

  // WhatsApp chatbot routes
  app.get("/whatsapp/webhook", whatsappWebhookVerify);
  app.post("/whatsapp/webhook", whatsappWebhook);
  app.get("/public/whatsapp-launch-config", whatsappLaunchConfig);
  app.get("/whatsapp/precheck-status/:referenceId", precheckStatus);
}

module.exports = { registerRoutes };
