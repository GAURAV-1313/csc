/**
 * WhatsApp Service
 *
 * Abstracts the underlying WhatsApp provider (Twilio or whatsapp-web.js).
 * In webhook mode (Twilio / Meta Cloud API) the provider only needs to
 * format outgoing reply payloads — actual sending is handled by the webhook
 * route returning TwiML or a JSON reply.
 *
 * Supported providers (WHATSAPP_PROVIDER env var):
 *   - "twilio"         : Twilio WhatsApp API (default)
 *   - "whatsapp_web"   : whatsapp-web.js local client
 *   - "mock"           : No-op for testing
 */

const PROVIDER = (process.env.WHATSAPP_PROVIDER || "twilio").toLowerCase();

/**
 * Format an outgoing message as a Twilio TwiML XML string.
 */
function formatTwilioReply(toNumber, messageBody) {
  const escaped = (messageBody || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>${escaped}</Body></Message></Response>`;
}

/**
 * Send a WhatsApp message using the configured provider.
 * For Twilio webhook flows, replies are returned inline (not sent via API),
 * so this function is used only when proactively sending messages outside a webhook.
 */
async function sendMessage(toNumber, messageBody) {
  if (PROVIDER === "mock") {
    return { provider: "mock", to: toNumber, body: messageBody };
  }

  if (PROVIDER === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio credentials are not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER)");
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams({
      From: `whatsapp:${fromNumber}`,
      To: `whatsapp:${toNumber}`,
      Body: messageBody
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twilio API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  if (PROVIDER === "meta") {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      throw new Error("Meta credentials are not configured (META_WHATSAPP_TOKEN, META_PHONE_NUMBER_ID)");
    }

    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: toNumber,
      type: "text",
      text: { body: messageBody }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meta API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  if (PROVIDER === "whatsapp_web") {
    throw new Error("whatsapp_web provider is not yet initialized. Call initWhatsAppWebClient() first.");
  }

  throw new Error(`Unknown WHATSAPP_PROVIDER: ${PROVIDER}`);
}

/**
 * Parse an incoming Twilio webhook body and return normalised fields.
 */
function parseTwilioWebhook(body) {
  const from = (body.From || "").replace(/^whatsapp:/, "");
  const to = (body.To || "").replace(/^whatsapp:/, "");
  const text = body.Body || "";
  return { from, to, text };
}

/**
 * Parse an incoming Meta (Facebook) Cloud API webhook payload.
 */
function parseMetaWebhook(body) {
  try {
    const entry = (body.entry || [])[0] || {};
    const change = (entry.changes || [])[0] || {};
    const value = change.value || {};
    const message = (value.messages || [])[0] || {};
    const from = message.from || "";
    const text = (message.text || {}).body || "";
    return { from, to: "", text };
  } catch (_) {
    return { from: "", to: "", text: "" };
  }
}

/**
 * Verify an incoming Meta (Facebook) webhook subscription request.
 * Meta sends a GET request with hub.mode, hub.verify_token, and hub.challenge.
 * Returns true if verified (caller should respond with hub.challenge), false otherwise.
 */
function verifyMetaWebhook(query) {
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];
  const verifyToken = process.env.META_VERIFY_TOKEN;

  if (mode === "subscribe" && verifyToken && token === verifyToken) {
    return { verified: true, challenge };
  }
  return { verified: false, challenge: null };
}

/**
 * Build a launch configuration for the client-side WhatsApp button.
 * Returns the WhatsApp deep-link URL and display metadata.
 */
function getLaunchConfig() {
  const phoneNumber = (process.env.TWILIO_WHATSAPP_NUMBER || process.env.WHATSAPP_BUSINESS_NUMBER || "").replace(/\D/g, "");
  const greeting = encodeURIComponent("Hi! I would like to start a pre-check for a CSC service.");
  const whatsappUrl = phoneNumber ? `https://wa.me/${phoneNumber}?text=${greeting}` : null;

  return {
    provider: PROVIDER,
    whatsapp_url: whatsappUrl,
    phone_number: phoneNumber || null,
    greeting_message: decodeURIComponent(greeting),
    instructions: "Click the link above to open WhatsApp and begin your pre-check conversation."
  };
}

module.exports = {
  sendMessage,
  formatTwilioReply,
  parseTwilioWebhook,
  parseMetaWebhook,
  verifyMetaWebhook,
  getLaunchConfig,
  PROVIDER
};
