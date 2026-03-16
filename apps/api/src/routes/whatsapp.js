const { processMessage } = require("../modules/whatsapp/conversationFlow");
const { getConversation, saveConversation, savePrecheckRecord, getPrecheckByReferenceId } = require("../modules/whatsapp/whatsappStore");
const { formatTwilioReply, parseTwilioWebhook, parseMetaWebhook, getLaunchConfig, PROVIDER } = require("../modules/whatsapp/whatsappService");
const { getCitizenReport, lookupCitizenReport, getPrecheckPdf, getBotLaunchConfig, isBotConfigured } = require("../modules/whatsapp/botClient");

/**
 * POST /whatsapp/webhook
 *
 * Handles incoming WhatsApp messages from Twilio or Meta Cloud API.
 * Twilio expects a TwiML XML response; other providers receive a JSON reply.
 */
async function whatsappWebhook(req, res) {
  try {
    const body = req.body || {};

    let phoneNumber, incomingText;

    if (PROVIDER === "twilio" || PROVIDER === "mock") {
      const parsed = parseTwilioWebhook(body);
      phoneNumber = parsed.from;
      incomingText = parsed.text;
    } else {
      const parsed = parseMetaWebhook(body);
      phoneNumber = parsed.from;
      incomingText = parsed.text;
    }

    if (!phoneNumber) {
      res.status(400).json({ error: "Missing sender phone number" });
      return;
    }

    const existingConversation = await getConversation(phoneNumber);
    const { reply, conversation, precheckRecord } = processMessage(phoneNumber, incomingText, existingConversation);

    await saveConversation(conversation);

    if (precheckRecord) {
      await savePrecheckRecord(precheckRecord);
    }

    if (PROVIDER === "twilio") {
      res.set("Content-Type", "text/xml");
      res.send(formatTwilioReply(phoneNumber, reply));
      return;
    }

    // For Meta / mock providers return JSON
    res.json({ reply });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /public/whatsapp-launch-config
 *
 * Returns the WhatsApp launch configuration for the website button.
 * When BOT_API_BASE_URL is configured, proxies the bot's launch config
 * (which includes deep_link).  Falls back to locally generated config.
 * This endpoint is public (no authentication required).
 */
async function whatsappLaunchConfig(req, res) {
  try {
    const botConfig = await getBotLaunchConfig();
    if (botConfig) {
      res.json(botConfig);
      return;
    }
  } catch (_) {
    // fall through to local config
  }
  res.json(getLaunchConfig());
}

/**
 * GET /whatsapp/precheck-status/:referenceId
 *
 * Allows a CSC operator to fetch pre-check data using a Reference ID.
 */
async function precheckStatus(req, res) {
  const { referenceId } = req.params;
  if (!referenceId) {
    res.status(400).json({ error: "referenceId is required" });
    return;
  }

  const record = await getPrecheckByReferenceId(referenceId);
  if (!record) {
    res.status(404).json({ error: "Reference ID not found" });
    return;
  }

  // Parse stored JSON if using SQLite (stored as string)
  let precheckData = record.precheck_data;
  if (typeof precheckData === "string") {
    try {
      precheckData = JSON.parse(precheckData);
    } catch (_) {
      precheckData = {};
    }
  }

  let requiredDocuments = record.required_documents;
  if (typeof requiredDocuments === "string") {
    try {
      requiredDocuments = JSON.parse(requiredDocuments);
    } catch (_) {
      requiredDocuments = [];
    }
  }

  res.json({
    reference_id: record.reference_id,
    phone_number: record.phone_number,
    service_type: record.service_type,
    precheck_data: precheckData,
    required_documents: requiredDocuments || [],
    pdf_url: record.pdf_url || "",
    view_url: record.view_url || "",
    eligibility_status: record.eligibility_status || "approved",
    eligibility_message: record.eligibility_message || "",
    status: record.status,
    created_at: record.created_at,
    updated_at: record.updated_at
  });
}

/**
 * GET /whatsapp-report/:referenceId
 *
 * Proxies a citizen pre-check report from the external WhatsApp bot API.
 * Requires BOT_API_BASE_URL and BOT_API_TOKEN to be configured.
 *
 * The operator UI calls this endpoint with the Reference ID the citizen
 * received from the bot (format: PC-XXXXXX).
 */
async function whatsappReport(req, res) {
  const { referenceId } = req.params;
  if (!referenceId) {
    res.status(400).json({ error: "referenceId is required" });
    return;
  }

  if (!isBotConfigured()) {
    res.status(503).json({
      error: "Bot API is not configured. Set BOT_API_BASE_URL (or APP_BASE_URL) in the environment."
    });
    return;
  }

  try {
    const report = await getCitizenReport(referenceId);
    res.json(report);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Bot API error" });
  }
}

/**
 * POST /whatsapp-report/lookup
 *
 * Same as GET /whatsapp-report/:referenceId but accepts the Reference ID
 * in the request body.  Useful when the operator submits a lookup form.
 *
 * Body: { "reference_id": "PC-0VLTMA" }
 */
async function whatsappReportLookup(req, res) {
  const { reference_id: referenceId } = req.body || {};
  if (!referenceId) {
    res.status(400).json({ error: "reference_id is required in the request body" });
    return;
  }

  if (!isBotConfigured()) {
    res.status(503).json({
      error: "Bot API is not configured. Set BOT_API_BASE_URL (or APP_BASE_URL) in the environment."
    });
    return;
  }

  try {
    const report = await lookupCitizenReport(referenceId);
    res.json(report);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Bot API error" });
  }
}

/**
 * GET /precheck/:id/pdf
 *
 * Returns the PDF report for a Reference ID by proxying the bot API
 * or redirecting to stored PDF URL if available locally.
 */
async function precheckPdf(req, res) {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  if (isBotConfigured()) {
    try {
      const pdf = await getPrecheckPdf(id);
      res.setHeader("Content-Type", pdf.contentType || "application/pdf");
      res.send(pdf.buffer);
      return;
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || "Bot API error" });
      return;
    }
  }

  const record = await getPrecheckByReferenceId(String(id).toUpperCase());
  if (record && record.pdf_url) {
    res.redirect(record.pdf_url);
    return;
  }

  res.status(404).json({ error: "PDF not found" });
}

/**
 * POST /whatsapp-integration/store-precheck
 *
 * Allows the external WhatsApp pre-check bot to push a completed pre-check
 * record into the CSC API's local store so operators can retrieve it by
 * Reference ID without needing the bot to be reachable.
 *
 * Authentication: Bearer token via the Authorization header.
 * The token must match the CSC_API_BEARER_TOKEN environment variable.
 *
 * Required body fields: reference_id, phone_number, service_type, precheck_data
 */
async function storePrecheck(req, res) {
  const token = process.env.CSC_API_BEARER_TOKEN;
  if (token) {
    const authHeader = req.headers["authorization"] || "";
    const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (provided !== token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  const body = req.body || {};
  const { reference_id, phone_number, service_type, precheck_data } = body;

  if (!reference_id || !phone_number || !service_type || !precheck_data ||
      typeof precheck_data !== "object" || Array.isArray(precheck_data)) {
    res.status(400).json({
      error: "Missing required fields: reference_id, phone_number, service_type, precheck_data (must be an object)"
    });
    return;
  }

  try {
    const record = {
      reference_id,
      phone_number,
      service_type,
      precheck_data,
      required_documents: body.required_documents || [],
      pdf_url: body.pdf_url || body.pdfUrl || "",
      view_url: body.view_url || body.viewUrl || "",
      eligibility_status: body.eligibility_status || "",
      eligibility_message: body.eligibility_message || "",
      status: body.status || "completed"
    };

    await savePrecheckRecord(record);
    res.status(201).json({ success: true, reference_id });
  } catch (err) {
    console.error("storePrecheck error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /whatsapp/bot-status
 *
 * Returns the current integration status of the external WhatsApp pre-check bot.
 * Indicates whether the bot API is configured and reachable.
 * This endpoint is public (no authentication required).
 */
async function botStatus(req, res) {
  const configured = isBotConfigured();

  if (!configured) {
    res.json({
      configured: false,
      reachable: false,
      message: "Bot API is not configured. Set BOT_API_BASE_URL (or APP_BASE_URL) in the environment."
    });
    return;
  }

  const launchConfig = await getBotLaunchConfig();
  const reachable = launchConfig !== null;

  res.json({
    configured: true,
    reachable,
    bot_url: (process.env.BOT_API_BASE_URL || process.env.APP_BASE_URL || "").replace(/\/$/, "") || null,
    message: reachable
      ? "Bot API is configured and reachable."
      : "Bot API is configured but could not be reached. Check BOT_API_BASE_URL."
  });
}

module.exports = {
  whatsappWebhook,
  whatsappLaunchConfig,
  precheckStatus,
  whatsappReport,
  whatsappReportLookup,
  botStatus,
  storePrecheck,
  precheckPdf
};
