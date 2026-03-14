const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 2;

async function callMlApi(features) {
  const url = process.env.ML_API_URL;
  if (!url) {
    return null;
  }

  const retries = Number(process.env.ML_API_RETRIES || DEFAULT_RETRIES);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(features),
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text();
        if (attempt === retries) {
          return { error: `ML API error ${response.status}: ${text}` };
        }
      } else {
        const payload = await response.json();
        return payload;
      }
    } catch (err) {
      if (attempt === retries) {
        return { error: err.message };
      }
    } finally {
      clearTimeout(timeout);
    }

    await delay(300 * (attempt + 1));
  }

  return { error: "ML API unavailable" };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { callMlApi };
