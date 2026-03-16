# CSC AI Copilot – GovTech Form Validation System

CSC AI Copilot is a pre‑submission validation system that helps CSC operators fill government service applications before submitting to the Chhattisgarh eDistrict portal. It provides dynamic schema‑driven forms, document checks, OCR extraction, validation, risk features, and an operator‑focused workflow. The system also supports a WhatsApp pre‑check flow with Reference IDs.

## Highlights

- Dynamic forms generated from JSON schemas
- Validation engine with field rules, required docs, and OCR mismatch checks
- Document pipeline with OCR (image + scanned PDF)
- Risk feature extraction + ML integration
- WhatsApp pre‑check Reference ID lookup + PDF report support
- React + Vite frontend in Digital Seva theme

## Repository Layout

```
/Users/gaurav/csc
├─ apps/
│  ├─ api/                 Express API (backend)
│  └─ operator-ui/         React + Vite (frontend)
├─ data/                   Schemas, services, rules, samples
├─ db/                     SQLite migrations
├─ prisma/                 Prisma schema
└─ docs/                   Project notes
```

## Services Supported

The system supports 40 services (including the original six):

- income_certificate
- domicile_certificate
- sc_st_certificate
- obc_certificate
- land_use_information
- birth_certificate_correction
- plus additional eDistrict services loaded from `data/services/services.json`

## Frontend

**Location:** `/Users/gaurav/csc/apps/operator-ui`

### Run
```
cd /Users/gaurav/csc/apps/operator-ui
npm install
npm run dev
```

### Build
```
npm run build
```

### Frontend Features

- Login page (Digital Seva themed)
- Service dashboard with search and pinned top six services
- Intro page per service (bilingual; Hindi uses translated intro where available)
- Dynamic form rendering from schema
- Aadhaar/PAN upload with OCR prefill + preview
- Real‑time field validation (red inputs)
- Auto‑validation on each change (debounced)
- AI Review Panel (missing fields, missing docs, OCR mismatches, risk)
- WhatsApp pre‑check lookup (Reference ID + PDF download)
- Chat widget (Gemini‑powered, Hindi/English/Hinglish)

## Backend

**Location:** `/Users/gaurav/csc/apps/api`

### Run
```
cd /Users/gaurav/csc/apps/api
npm install
npm run dev
```

API default: `http://localhost:4000`

### Environment

Backend reads env from:
`/Users/gaurav/csc/apps/api/.env`

Key settings:
```
STORAGE_MODE=sqlite|json
DATABASE_URL=file:/Users/gaurav/csc/prisma/app.db
PORT=4000

# OCR
OCR_MODE=live
OCR_PDF_MAX_PAGES=3
OCR_LANGUAGES=eng+hin

# Gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash

# WhatsApp external bot
BOT_API_BASE_URL=...
BOT_API_TOKEN=...
```

## Core API Endpoints

### Services + Applications
- `GET /services`
- `GET /services/:serviceType`
- `POST /applications` (draft)
- `POST /applications/:applicationId/documents`
- `POST /validate-application`
- `POST /predict-risk`
- `POST /applications/:applicationId/submit`

### WhatsApp / Reference ID Integration
- `GET /public/whatsapp-launch-config`
- `GET /citizen-report/:referenceId`
- `POST /citizen-report/lookup`
- `GET /precheck/:id/pdf`

### Optional Bot Webhook (if hosting bot in API)
- `POST /whatsapp/webhook`

## OCR Pipeline

- `tesseract.js` for image OCR
- `pdf-parse` for text‑based PDFs
- `pdfjs-dist` + `@napi-rs/canvas` for scanned PDFs
- OCR fields feed document mismatch checks (Aadhaar/PAN/DOB/name)

## Validation Flow

- **Schema validation**: required fields, formats, constraints
- **Document validation**: required docs + accepted groups
- **OCR mismatch**: compares document fields vs form data
- **Risk features**: missing docs/fields, mismatch count, quality score

## WhatsApp Pre‑Check Flow

1. Citizen starts WhatsApp from website
2. Bot returns Reference ID + PDF report
3. Operator enters Reference ID in form
4. System fetches citizen data + PDF and pre-fills fields

## Database (SQLite)

- Prisma schema: `/Users/gaurav/csc/prisma/schema.prisma`
- Migrations: `/Users/gaurav/csc/db/migrations`

Apply migrations:
```
sqlite3 /Users/gaurav/csc/prisma/app.db < /Users/gaurav/csc/db/migrations/001_init.sql
sqlite3 /Users/gaurav/csc/prisma/app.db < /Users/gaurav/csc/db/migrations/002_whatsapp_prechecks.sql
```

## Seed / Test Data

Seed precheck record (Reference ID):
- `PC-DEMO01`

## Troubleshooting

- **ERR_CONNECTION_REFUSED**: API not running or wrong `VITE_API_BASE_URL`
- **WhatsApp lookup 404**: API not restarted after route changes
- **OCR not working**: check `OCR_MODE=live` and OCR deps installed
- **Gemini errors**: verify `GEMINI_API_KEY`

## Notes

- LLM explanation is currently disabled by default (see `/apps/api/src/modules/llm/explain.js`).
- Auto‑validation runs on every change (debounced). If you want manual‑only, adjust in `ApplicationForm.tsx`.

