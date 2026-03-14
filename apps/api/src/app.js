const express = require("express");
const cors = require("cors");
const multer = require("multer");

const { registerRoutes } = require("./routes");
const { syncSchemasFromJson } = require("./modules/services/serviceSchema");

function createApp() {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage() });

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    req.operatorId = req.headers["x-operator-id"] || req.body.operator_id || "operator_demo";
    next();
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if ((process.env.STORAGE_MODE || "json").toLowerCase() === "sqlite") {
    syncSchemasFromJson().catch((err) => {
      console.error("Schema sync failed", err.message);
    });
  }

  registerRoutes(app, upload);

  return app;
}

module.exports = { createApp };
