# CSC AI Copilot (Hackathon)

Single-backend Express API that implements the full AI pre-submission flow:
- Rule validation
- Document OCR extraction (stub-ready)
- Feature extraction
- ML risk prediction integration
- Scheme recommendation
- LLM explanation
- WhatsApp chatbot pre-check flow

## WhatsApp Bot Integration

The operator UI integrates with a WhatsApp pre-check bot via the CSC API.

### Integration Flow

```
Operator UI (apps/operator-ui)
    │
    │  Click "Chat on WhatsApp"
    ↓
POST /whatsapp-integration/initiate-precheck
    │  Body: { applicationData: { serviceType, citizenData, ... } }
    │
CSC API (apps/api)
    ├─ 1. Validates application (rules engine)
    ├─ 2. Generates precheck ID (PC-XXXXXX)
    ├─ 3. Calls bot API: POST /whatsapp-integration/store-precheck
    │     (non-blocking – errors are logged, not surfaced)
    └─ 4. Returns { precheckId, botNumber }
    │
Operator UI
    └─ Opens: https://wa.me/<botNumber>?text=hii
    │
Citizen sends "hii" on WhatsApp
    │
Bot → language selection → service selection → pre-check flow
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp sandbox/business number | `+14155238886` |
| `BOT_API_BASE_URL` | Base URL of the external WhatsApp bot | `https://whatsapp-precheck-bot.onrender.com` |
| `BOT_API_TOKEN` | Bearer token for bot API auth | (secret) |
| `WHATSAPP_PROVIDER` | WhatsApp provider (`twilio` / `mock`) | `twilio` |

### API Endpoints

#### `POST /whatsapp-integration/initiate-precheck`

Validates an application and initiates a WhatsApp pre-check session.

**Request:**
```json
{
  "applicationData": {
    "serviceType": "income-certificate",
    "citizenData": { "name": "Ramesh Kumar", "district": "Raipur" }
  }
}
```

**Success response:**
```json
{
  "success": true,
  "precheckId": "PC-A3F9C2",
  "botNumber": "+14155238886",
  "message": "Ready to chat",
  "validation": { "warnings": [], "missingDocuments": [] }
}
```

### Frontend Hook

Use `useWhatsAppAPI` from `apps/operator-ui/src/hooks/useWhatsAppAPI.ts`:

```typescript
import { useWhatsAppAPI } from "../hooks/useWhatsAppAPI";

const { callAPI, loading, error, success, precheckId } = useWhatsAppAPI();

// On button click:
await callAPI({ serviceType: "income-certificate", citizenData: { ... } });
// → Opens WhatsApp with "hii" pre-filled
```

## Storage

Default storage is JSON files (fastest for hackathon demos).

Hybrid mode is supported:
- `STORAGE_MODE=json` (default)
- `STORAGE_MODE=sqlite`

SQLite setup: `/Users/gaurav/csc/docs/db-setup.md`

## Env (SQLite)

Backend reads env from `/Users/gaurav/csc/apps/api/.env`.

```
STORAGE_MODE=sqlite
DATABASE_URL=file:/Users/gaurav/csc/prisma/app.db
```

## SQLite artifacts
