const test = require("node:test");
const assert = require("node:assert/strict");

// botClient reads env vars at call-time, so we can manipulate process.env per test.
// We also mock globalThis.fetch to avoid real network calls.

const {
  isBotConfigured,
  getCitizenReport,
  lookupCitizenReport,
  getBotLaunchConfig
} = require("./botClient");

// ─── helpers ────────────────────────────────────────────────────────────────

function setEnv(base, token) {
  if (base !== undefined) process.env.BOT_API_BASE_URL = base;
  else delete process.env.BOT_API_BASE_URL;

  if (token !== undefined) process.env.BOT_API_TOKEN = token;
  else delete process.env.BOT_API_TOKEN;
}

function clearEnv() {
  delete process.env.BOT_API_BASE_URL;
  delete process.env.BOT_API_TOKEN;
}

function makeFetch(status, data) {
  const body = typeof data === "string" ? data : JSON.stringify(data);
  return async (url, _opts) => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    json: async () => (typeof data === "string" ? JSON.parse(data) : data)
  });
}

// ─── isBotConfigured ────────────────────────────────────────────────────────

test("isBotConfigured returns false when both env vars are absent", () => {
  clearEnv();
  assert.equal(isBotConfigured(), false);
});

test("isBotConfigured returns false when only BOT_API_BASE_URL is set", () => {
  setEnv("https://bot.example.com", undefined);
  assert.equal(isBotConfigured(), false);
  clearEnv();
});

test("isBotConfigured returns false when only BOT_API_TOKEN is set", () => {
  setEnv(undefined, "secret");
  assert.equal(isBotConfigured(), false);
  clearEnv();
});

test("isBotConfigured returns true when both env vars are set", () => {
  setEnv("https://bot.example.com", "secret");
  assert.equal(isBotConfigured(), true);
  clearEnv();
});

// ─── getCitizenReport ────────────────────────────────────────────────────────

test("getCitizenReport throws 503 when bot is not configured", async () => {
  clearEnv();
  await assert.rejects(
    () => getCitizenReport("PC-TEST1"),
    (err) => {
      assert.equal(err.status, 503);
      return true;
    }
  );
});

test("getCitizenReport normalises reference ID to upper-case", async () => {
  setEnv("https://bot.example.com", "token");
  const report = { reference_id: "PC-TEST1", status: "completed", citizen_data: {} };
  let capturedUrl;
  globalThis.fetch = async (url, _opts) => {
    capturedUrl = url;
    return { ok: true, status: 200, json: async () => report };
  };

  await getCitizenReport("pc-test1");
  assert.ok(capturedUrl.includes("PC-TEST1"), `URL should contain upper-case ID, got: ${capturedUrl}`);
  clearEnv();
});

test("getCitizenReport calls GET /citizen-report/:id with Bearer token", async () => {
  setEnv("https://bot.example.com", "my-token");
  const report = { reference_id: "PC-ABC", status: "completed", citizen_data: {} };
  let capturedUrl, capturedHeaders;
  globalThis.fetch = async (url, opts) => {
    capturedUrl = url;
    capturedHeaders = opts?.headers || {};
    return { ok: true, status: 200, json: async () => report };
  };

  const result = await getCitizenReport("PC-ABC");
  assert.equal(capturedUrl, "https://bot.example.com/citizen-report/PC-ABC");
  assert.equal(capturedHeaders.Authorization, "Bearer my-token");
  assert.deepEqual(result, report);
  clearEnv();
});

test("getCitizenReport strips trailing slash from base URL", async () => {
  setEnv("https://bot.example.com/", "token");
  let capturedUrl;
  globalThis.fetch = async (url, _opts) => {
    capturedUrl = url;
    return { ok: true, status: 200, json: async () => ({}) };
  };

  await getCitizenReport("PC-XYZ");
  assert.ok(!capturedUrl.includes("//citizen-report"), `Double slash in URL: ${capturedUrl}`);
  clearEnv();
});

test("getCitizenReport throws 401 on Unauthorized response", async () => {
  setEnv("https://bot.example.com", "bad-token");
  globalThis.fetch = makeFetch(401, "Unauthorized");

  await assert.rejects(
    () => getCitizenReport("PC-X"),
    (err) => {
      assert.equal(err.status, 401);
      return true;
    }
  );
  clearEnv();
});

test("getCitizenReport throws 404 when reference ID not found", async () => {
  setEnv("https://bot.example.com", "token");
  globalThis.fetch = makeFetch(404, "Not Found");

  await assert.rejects(
    () => getCitizenReport("PC-MISSING"),
    (err) => {
      assert.equal(err.status, 404);
      assert.ok(err.message.includes("PC-MISSING"));
      return true;
    }
  );
  clearEnv();
});

test("getCitizenReport throws with bot error status on other non-ok response", async () => {
  setEnv("https://bot.example.com", "token");
  globalThis.fetch = makeFetch(503, "Service Unavailable");

  await assert.rejects(
    () => getCitizenReport("PC-Y"),
    (err) => {
      assert.equal(err.status, 503);
      return true;
    }
  );
  clearEnv();
});

// ─── lookupCitizenReport ─────────────────────────────────────────────────────

test("lookupCitizenReport throws 503 when bot is not configured", async () => {
  clearEnv();
  await assert.rejects(
    () => lookupCitizenReport("PC-TEST1"),
    (err) => {
      assert.equal(err.status, 503);
      return true;
    }
  );
});

test("lookupCitizenReport sends POST to /citizen-report/lookup with reference_id in body", async () => {
  setEnv("https://bot.example.com", "my-token");
  const report = { reference_id: "PC-ABC123", status: "completed", citizen_data: { name: "Test" } };
  let capturedUrl, capturedMethod, capturedBody, capturedHeaders;
  globalThis.fetch = async (url, opts) => {
    capturedUrl = url;
    capturedMethod = opts?.method;
    capturedBody = opts?.body;
    capturedHeaders = opts?.headers || {};
    return { ok: true, status: 200, json: async () => report };
  };

  const result = await lookupCitizenReport("pc-abc123");
  assert.equal(capturedUrl, "https://bot.example.com/citizen-report/lookup");
  assert.equal(capturedMethod, "POST");
  assert.deepEqual(JSON.parse(capturedBody), { reference_id: "PC-ABC123" });
  assert.equal(capturedHeaders.Authorization, "Bearer my-token");
  assert.deepEqual(result, report);
  clearEnv();
});

test("lookupCitizenReport normalises reference ID to upper-case in POST body", async () => {
  setEnv("https://bot.example.com", "token");
  let capturedBody;
  globalThis.fetch = async (_url, opts) => {
    capturedBody = opts?.body;
    return { ok: true, status: 200, json: async () => ({}) };
  };

  await lookupCitizenReport("pc-lower");
  assert.equal(JSON.parse(capturedBody).reference_id, "PC-LOWER");
  clearEnv();
});

test("lookupCitizenReport throws 401 on Unauthorized response", async () => {
  setEnv("https://bot.example.com", "bad-token");
  globalThis.fetch = makeFetch(401, "Unauthorized");

  await assert.rejects(
    () => lookupCitizenReport("PC-X"),
    (err) => {
      assert.equal(err.status, 401);
      return true;
    }
  );
  clearEnv();
});

test("lookupCitizenReport throws 404 when reference ID not found", async () => {
  setEnv("https://bot.example.com", "token");
  globalThis.fetch = makeFetch(404, "Not Found");

  await assert.rejects(
    () => lookupCitizenReport("PC-GONE"),
    (err) => {
      assert.equal(err.status, 404);
      return true;
    }
  );
  clearEnv();
});

// ─── getBotLaunchConfig ───────────────────────────────────────────────────────

test("getBotLaunchConfig returns null when BOT_API_BASE_URL is not set", async () => {
  clearEnv();
  const result = await getBotLaunchConfig();
  assert.equal(result, null);
});

test("getBotLaunchConfig fetches public endpoint without auth header", async () => {
  setEnv("https://bot.example.com", "token");
  const config = { deep_link: "https://wa.me/1234?text=START", whatsapp_number: "+1234567890" };
  let capturedUrl, capturedOpts;
  globalThis.fetch = async (url, opts) => {
    capturedUrl = url;
    capturedOpts = opts;
    return { ok: true, json: async () => config };
  };

  const result = await getBotLaunchConfig();
  assert.equal(capturedUrl, "https://bot.example.com/public/whatsapp-launch-config");
  // Public endpoint — no auth header should be sent
  assert.equal(capturedOpts, undefined);
  assert.deepEqual(result, config);
  clearEnv();
});

test("getBotLaunchConfig strips trailing slash from base URL", async () => {
  setEnv("https://bot.example.com/", "token");
  const config = { deep_link: "https://wa.me/1234?text=START" };
  let capturedUrl;
  globalThis.fetch = async (url) => {
    capturedUrl = url;
    return { ok: true, json: async () => config };
  };

  await getBotLaunchConfig();
  assert.equal(capturedUrl, "https://bot.example.com/public/whatsapp-launch-config");
  clearEnv();
});

test("getBotLaunchConfig returns null when bot endpoint returns non-ok response", async () => {
  setEnv("https://bot.example.com", "token");
  globalThis.fetch = makeFetch(503, "Service Unavailable");

  const result = await getBotLaunchConfig();
  assert.equal(result, null);
  clearEnv();
});

test("getBotLaunchConfig returns null when fetch throws a network error", async () => {
  setEnv("https://bot.example.com", "token");
  globalThis.fetch = async () => { throw new TypeError("Failed to fetch"); };

  const result = await getBotLaunchConfig();
  assert.equal(result, null);
  clearEnv();
});
