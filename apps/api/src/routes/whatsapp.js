const { processMessage } = require("../modules/whatsapp/conversationFlow");
const { getConversation, saveConversation, savePrecheckRecord, getPrecheckByReferenceId } = require("../modules/whatsapp/whatsappStore");
const { formatTwilioReply, parseTwilioWebhook, parseMetaWebhook, getLaunchConfig, PROVIDER } = require("../modules/whatsapp/whatsappService");

/**
 * POST /whatsapp/webhook
 *
 * Handles incoming WhatsApp messages from Twilio or Meta Cloud API.
 * Twilio expects a TwiML XML response; Meta webhooks expect 200 OK with an
 * empty body (replies are sent via the Messaging API separately).
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
 * This endpoint is public (no authentication required).
 */
function whatsappLaunchConfig(req, res) {
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

  res.json({
    reference_id: record.reference_id,
    phone_number: record.phone_number,
    service_type: record.service_type,
    precheck_data: precheckData,
    status: record.status,
    created_at: record.created_at,
    updated_at: record.updated_at
  });
}

module.exports = {
  whatsappWebhook,
  whatsappLaunchConfig,
  precheckStatus
};
