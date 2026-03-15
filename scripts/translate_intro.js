const fs = require('fs');
const path = require('path');
const fetch = global.fetch;
require('dotenv').config({ path: '/Users/gaurav/csc/apps/api/.env' });

const inputPath = '/Users/gaurav/csc/apps/operator-ui/src/data/serviceIntro.ts';
const outPath = inputPath;

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const minDelayMs = Number(process.env.GEMINI_MIN_DELAY_MS || 12000);
const maxRetries = Number(process.env.GEMINI_MAX_RETRIES || 8);
if (!apiKey) {
  console.error('GEMINI_API_KEY not set');
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryDelayMs(errorPayload) {
  const retryInfo = errorPayload?.error?.details?.find((d) => d?.['@type']?.includes('RetryInfo'));
  const retryDelay = retryInfo?.retryDelay;
  if (typeof retryDelay === 'string' && /s$/.test(retryDelay)) {
    const seconds = Number(retryDelay.replace(/s$/, ''));
    if (Number.isFinite(seconds)) {
      return Math.ceil(seconds * 1000);
    }
  }
  return null;
}

async function translate(text) {
  if (!text || !text.trim()) return '';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    systemInstruction: { role: 'system', parts: [{ text: 'Translate to Hindi. Keep official tone. Do not add new info.' }] },
    contents: [{ role: 'user', parts: [{ text }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const raw = await res.text();
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      // keep raw payload if not valid JSON
    }
    const err = new Error(`Gemini error ${res.status}: ${raw}`);
    err.status = res.status;
    err.retryDelayMs = parseRetryDelayMs(parsed);
    throw err;
  }
  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim();
  return txt || '';
}

async function translateWithRetry(text, label) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await translate(text);
    } catch (err) {
      attempt += 1;
      const status = err?.status;
      const retryable = status === 429 || status === 503;
      if (!retryable || attempt > maxRetries) {
        throw err;
      }

      const retryDelayMs = Math.max(
        minDelayMs,
        Number(err?.retryDelayMs || 0),
        attempt * 2000
      );
      console.warn(
        `Rate limited while translating ${label}. Retry ${attempt}/${maxRetries} in ${Math.ceil(retryDelayMs / 1000)}s...`
      );
      // eslint-disable-next-line no-await-in-loop
      await sleep(retryDelayMs);
    }
  }
  return '';
}

function loadServiceIntro() {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const marker = 'export const serviceIntroMap';
  const idx = raw.indexOf(marker);
  if (idx === -1) throw new Error('Failed to locate serviceIntroMap');
  const start = raw.indexOf('{', idx);
  if (start === -1) throw new Error('Failed to locate object start');
  let depth = 0;
  let end = -1;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth === 0) { end = i; break; }
  }
  if (end === -1) throw new Error('Failed to locate object end');
  const objLiteral = raw.slice(start, end + 1);
  const fn = new Function(`return (${objLiteral});`);
  return fn();
}

function writeServiceIntro(map) {
  const entries = Object.entries(map).map(([key, val]) => {
    const v = {
      introduction: val.introduction || '',
      introduction_hi: val.introduction_hi || '',
      feeInfo: val.feeInfo || '',
      contact: val.contact || '',
      timeLimit: val.timeLimit || '',
      pageUrl: val.pageUrl || null
    };
    return `  "${key}": ${JSON.stringify(v, null, 2)}`;
  });

  const output = `export type ServiceIntro = {\n  introduction: string;\n  introduction_hi: string;\n  feeInfo?: string;\n  contact?: string;\n  timeLimit?: string;\n  pageUrl?: string | null;\n};\n\nexport const serviceIntroMap: Record<string, ServiceIntro> = {\n${entries.join(',\n')}\n};\n`;
  fs.writeFileSync(outPath, output);
}

async function run() {
  const map = loadServiceIntro();
  const keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const entry = map[key];
    if (!entry || !entry.introduction) continue;
    if (entry.introduction_hi && entry.introduction_hi.trim().length > 10 && !entry.introduction_hi.includes('ऑनलाइन आवेदन की सुविधा')) {
      continue; // already translated
    }
    console.log(`Translating ${key} (${i + 1}/${keys.length})...`);
    // eslint-disable-next-line no-await-in-loop
    const hi = await translateWithRetry(entry.introduction, key);
    entry.introduction_hi = hi || entry.introduction_hi || '';
    // Persist progress so reruns resume from this point.
    writeServiceIntro(map);
    // Respect free-tier per-minute request limit (5 rpm => >=12s gap).
    // eslint-disable-next-line no-await-in-loop
    await sleep(minDelayMs);
  }
  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
