/**
 * Bot Integration Service
 *
 * Handles communication between the CSC API and the external WhatsApp
 * pre-check bot.  When the operator clicks "Chat on WhatsApp", the CSC API
 * stores a precheck session in the bot so that when the citizen sends "hii"
 * the bot can retrieve the pre-validated application context.
 *
 * Required environment variables:
 *   BOT_API_BASE_URL       - Base URL of the WhatsApp bot service
 *                            (e.g. https://whatsapp-precheck-bot.onrender.com)
 *   BOT_API_TOKEN          - Shared Bearer token for bot API auth
 *                            (must match the token configured on the bot side)
 *   TWILIO_WHATSAPP_NUMBER - Twilio WhatsApp number shown to citizens
 *                            (e.g. +14155238886)
 */

const crypto = require("crypto");

function botBaseUrl() {
  return (process.env.BOT_API_BASE_URL || "").replace(/\/$/, "");
}

function botHeaders() {
  const token = process.env.BOT_API_TOKEN || process.env.BOT_API_BEARER_TOKEN || "";
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Returns true when BOT_API_BASE_URL is set (token is optional).
 */
function isBotConfigured() {
  return Boolean(process.env.BOT_API_BASE_URL);
}

/**
 * Generate a unique precheck session ID.
 * Format: PC-XXXXXX (6 hex characters, upper-cased).
 *
 * @returns {string} e.g. "PC-A3F9C2"
 */
function generatePrecheckId() {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `PC-${suffix}`;
}

/**
 * Return WhatsApp bot number and connectivity status from environment config.
 *
 * Note: The same env-var fallback chain (TWILIO_WHATSAPP_NUMBER →
 * WHATSAPP_BUSINESS_NUMBER) is used in whatsappService.getLaunchConfig().
 * Both files read directly from process.env to stay self-contained and
 * avoid coupling the services layer to the whatsapp module.
 *
 * @returns {{ botNumber: string|null, configured: boolean, baseUrl: string|null }}
 */
function getBotConfig() {
  const botNumber =
    (process.env.TWILIO_WHATSAPP_NUMBER || process.env.WHATSAPP_BUSINESS_NUMBER || "").trim() || null;

  return {
    botNumber,
    configured: isBotConfigured(),
    baseUrl: botBaseUrl() || null
  };
}

/**
 * Store precheck data in the external WhatsApp bot system.
 *
 * Calls POST /whatsapp-integration/store-precheck on the bot API so that
 * when the citizen later sends "hii" the bot can look up the pre-validated
 * application context by precheck ID.
 *
 * Errors are returned (not thrown) so that callers can decide whether to
 * degrade gracefully or surface them.
 *
 * @param {string} precheckId         - Unique session ID (e.g. "PC-A3F9C2")
 * @param {object} applicationData    - Application payload to persist in bot
 * @returns {Promise<{ stored: boolean, error?: string }>}
 */
async function storePrecheckData(precheckId, applicationData) {
  if (!isBotConfigured()) {
    return { stored: false, error: "Bot API not configured (BOT_API_BASE_URL not set)" };
  }

  const url = `${botBaseUrl()}/whatsapp-integration/store-precheck`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: botHeaders(),
      body: JSON.stringify({
        precheck_id: precheckId,
        application_data: applicationData
      })
    });

    if (response.status === 401) {
      return { stored: false, error: "Bot API: Unauthorized (check BOT_API_TOKEN)" };
    }

    if (!response.ok) {
      const text = await response.text();
      return { stored: false, error: `Bot API error ${response.status}: ${text}` };
    }

    return { stored: true };
  } catch (err) {
    return { stored: false, error: `Bot API unreachable: ${err.message}` };
  }
}

module.exports = {
  generatePrecheckId,
  getBotConfig,
  storePrecheckData,
  isBotConfigured
};
