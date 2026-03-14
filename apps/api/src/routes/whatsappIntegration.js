/**
 * WhatsApp Integration Routes
 *
 * POST /whatsapp-integration/initiate-precheck
 *   Validates the application using CSC logic, stores a precheck session
 *   in the external WhatsApp bot, and returns the bot's WhatsApp number
 *   together with a precheck ID so the frontend can open a wa.me deep-link.
 *
 * Integration flow:
 *   1. Frontend sends application data to this endpoint.
 *   2. CSC API validates the application (rules engine).
 *   3. CSC API stores the precheck session in the bot (non-blocking).
 *   4. CSC API returns { precheckId, botNumber } to the frontend.
 *   5. Frontend opens: https://wa.me/<botNumber>?text=hii
 *   6. Citizen sends "hii" → bot retrieves precheck context and starts flow.
 */

const { runValidation } = require("../modules/validation/validateApplication");
const { getServiceByType } = require("../modules/services/serviceSchema");
const { generatePrecheckId, getBotConfig, storePrecheckData } = require("../services/botIntegration");

/**
 * POST /whatsapp-integration/initiate-precheck
 *
 * Request body:
 *   { applicationData: { serviceType, citizenData, documents, ... } }
 *
 * Success response (200):
 *   {
 *     success: true,
 *     precheckId: "PC-A3F9C2",
 *     botNumber: "+14155238886",
 *     message: "Ready to chat",
 *     validation: { warnings: [...], missingDocuments: [...] } | null
 *   }
 *
 * Error responses:
 *   400 – Missing or malformed request body
 *   503 – Bot WhatsApp number not configured
 *   500 – Unexpected server error
 */
async function initiatePrecheck(req, res) {
  try {
    const { applicationData = {} } = req.body || {};
    const { serviceType, citizenData, documents } = applicationData;

    // Run CSC validation rules when a service type is provided
    let validationResult = null;
    if (serviceType) {
      const service = await getServiceByType(serviceType);
      validationResult = runValidation({ serviceType, citizenData, documents, service });
    }

    // Generate a unique precheck session ID for this citizen interaction
    const precheckId = generatePrecheckId();

    // Attempt to persist the precheck data in the bot system.
    // Errors here are logged and do NOT abort the response – the citizen can
    // still open WhatsApp and the bot will start a fresh session if needed.
    // The precheckId is passed both as the top-level parameter (for routing)
    // and as precheck_id within the payload (so the bot can store and look it up).
    const storeResult = await storePrecheckData(precheckId, {
      ...applicationData,
      precheck_id: precheckId,
      operator_id: req.operatorId,
      validation: validationResult,
      initiated_at: new Date().toISOString()
    });

    if (!storeResult.stored) {
      console.warn("[whatsapp-integration] Could not store precheck data in bot:", storeResult.error);
    }

    // Resolve the bot WhatsApp number from environment config
    const { botNumber } = getBotConfig();

    if (!botNumber) {
      return res.status(503).json({
        success: false,
        error: "WhatsApp bot number is not configured. Set TWILIO_WHATSAPP_NUMBER in the environment."
      });
    }

    return res.json({
      success: true,
      precheckId,
      botNumber,
      message: "Ready to chat",
      validation: validationResult
        ? {
            warnings: validationResult.warnings,
            missingDocuments: validationResult.missingDocuments
          }
        : null
    });
  } catch (err) {
    console.error("[whatsapp-integration] initiatePrecheck error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

module.exports = { initiatePrecheck };
