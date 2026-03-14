/**
 * Bot API Client
 *
 * Wraps authenticated HTTP calls to the external WhatsApp pre-check bot API.
 *
 * Required environment variables:
 *   BOT_API_BASE_URL  - Base URL of the bot service (e.g. https://xxx.trycloudflare.com)
 *   BOT_API_TOKEN     - Shared Bearer token (must match CSC_API_BEARER_TOKEN on the bot)
 *
 * The bot issues Reference IDs in the format PC-XXXXXX.
 * All Reference IDs are normalised to upper-case before sending.
 */

function botBaseUrl() {
  return (process.env.BOT_API_BASE_URL || "").replace(/\/$/, "");
}

function botHeaders() {
  return {
    Authorization: `Bearer ${process.env.BOT_API_TOKEN || ""}`,
    "Content-Type": "application/json"
  };
}

function isBotConfigured() {
  return Boolean(process.env.BOT_API_BASE_URL && process.env.BOT_API_TOKEN);
}

/**
 * Throw a descriptive error enriched with an HTTP status code.
 * @param {string} message
 * @param {number} status
 */
function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Fetch a citizen pre-check report by Reference ID.
 *
 * @param {string} referenceId  e.g. "PC-0VLTMA"
 * @returns {Promise<object>}   Citizen report JSON from the bot API
 * @throws  Error with .status set to the HTTP status code on failure
 */
async function getCitizenReport(referenceId) {
  if (!isBotConfigured()) {
    throw httpError("Bot API is not configured. Set BOT_API_BASE_URL and BOT_API_TOKEN.", 503);
  }

  const id = String(referenceId).toUpperCase();
  const url = `${botBaseUrl()}/citizen-report/${encodeURIComponent(id)}`;

  const response = await fetch(url, { headers: botHeaders() });

  if (response.status === 401) throw httpError("Bot API: Unauthorized. Check BOT_API_TOKEN.", 401);
  if (response.status === 404) throw httpError(`Reference ID ${id} not found`, 404);

  if (!response.ok) {
    const text = await response.text();
    throw httpError(`Bot API error ${response.status}: ${text}`, response.status);
  }

  return response.json();
}

/**
 * Fetch a citizen pre-check report using the POST lookup endpoint.
 * Behaves identically to getCitizenReport but uses the /citizen-report/lookup
 * endpoint (useful when the Reference ID comes from a form body).
 *
 * @param {string} referenceId  e.g. "PC-0VLTMA"
 * @returns {Promise<object>}   Citizen report JSON from the bot API
 * @throws  Error with .status set to the HTTP status code on failure
 */
async function lookupCitizenReport(referenceId) {
  if (!isBotConfigured()) {
    throw httpError("Bot API is not configured. Set BOT_API_BASE_URL and BOT_API_TOKEN.", 503);
  }

  const id = String(referenceId).toUpperCase();
  const url = `${botBaseUrl()}/citizen-report/lookup`;

  const response = await fetch(url, {
    method: "POST",
    headers: botHeaders(),
    body: JSON.stringify({ reference_id: id })
  });

  if (response.status === 401) throw httpError("Bot API: Unauthorized. Check BOT_API_TOKEN.", 401);
  if (response.status === 404) throw httpError(`Reference ID ${id} not found`, 404);

  if (!response.ok) {
    const text = await response.text();
    throw httpError(`Bot API error ${response.status}: ${text}`, response.status);
  }

  return response.json();
}

/**
 * Fetch the WhatsApp launch configuration from the bot's public endpoint.
 * Returns the deep-link URL and display metadata needed to render the
 * "Start on WhatsApp" button.
 *
 * @returns {Promise<object|null>} Launch config, or null when bot is not configured
 */
async function getBotLaunchConfig() {
  const base = botBaseUrl();
  if (!base) return null;

  try {
    const response = await fetch(`${base}/public/whatsapp-launch-config`);
    if (!response.ok) return null;
    return response.json();
  } catch (_) {
    return null;
  }
}

module.exports = {
  getCitizenReport,
  lookupCitizenReport,
  getBotLaunchConfig,
  isBotConfigured
};
