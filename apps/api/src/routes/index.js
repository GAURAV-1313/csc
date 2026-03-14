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
}

module.exports = { registerRoutes };
