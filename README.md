# CSC AI Copilot (Hackathon)

Single-backend Express API that implements the full AI pre-submission flow:
- Rule validation
- Document OCR extraction (stub-ready)
- Feature extraction
- ML risk prediction integration
- Scheme recommendation
- LLM explanation
- WhatsApp chatbot pre-check flow

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

- Migration SQL: `/Users/gaurav/csc/db/migrations/001_init.sql`
- Prisma schema: `/Users/gaurav/csc/prisma/schema.prisma`
- Seed data: `/Users/gaurav/csc/db/seed/services.sql`

---

## WhatsApp Chatbot

The API includes a WhatsApp pre-check bot that lets citizens gather required information before visiting a CSC centre. When the conversation is complete a **Reference ID** is generated which the operator can use to retrieve the pre-filled data.

### Supported providers

| `WHATSAPP_PROVIDER` | Description |
|---|---|
| `twilio` (default) | Twilio WhatsApp Sandbox / Business API |
| `meta` | Meta (Facebook) WhatsApp Cloud API |
| `mock` | No-op — replies returned as JSON, no external calls |

---

### Quick start with Twilio Sandbox

1. Create a free [Twilio](https://www.twilio.com/) account and activate the **WhatsApp Sandbox**.
2. Copy your credentials into `apps/api/.env`:

```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886   # Twilio sandbox number
```

3. Start the API:

```bash
npm run dev
```

4. Expose your local server (e.g. with [ngrok](https://ngrok.com/)):

```bash
ngrok http 4000
```

5. In the Twilio console, set the **Sandbox Webhook URL** to:

```
https://<your-ngrok-id>.ngrok.io/whatsapp/webhook
```
Method: **HTTP POST**

6. Send any message to the Twilio sandbox number on WhatsApp. The bot will guide the citizen through the pre-check flow.

---

### Quick start with Meta (WhatsApp Cloud API)

1. Create a [Meta for Developers](https://developers.facebook.com/) app with **WhatsApp** product.
2. Obtain your credentials and add them to `apps/api/.env`:

```env
WHATSAPP_PROVIDER=meta
META_WHATSAPP_TOKEN=EAAxxxxxxx          # Permanent / temporary access token
META_PHONE_NUMBER_ID=1234567890123      # Phone number ID from Meta dashboard
META_VERIFY_TOKEN=my_secret_verify_token
WHATSAPP_BUSINESS_NUMBER=+919876543210  # Your WhatsApp Business number
```

3. Start the API and expose it with ngrok (see step 4 above).
4. In the Meta developer console, configure the **Webhook URL**:

```
https://<your-ngrok-id>.ngrok.io/whatsapp/webhook
```

Set **Verify Token** to the same value as `META_VERIFY_TOKEN` and subscribe to the **messages** field.

---

### Webhook endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/whatsapp/webhook` | Meta webhook verification (echoes `hub.challenge`) |
| `POST` | `/whatsapp/webhook` | Incoming message handler (Twilio TwiML / Meta reply) |
| `GET` | `/public/whatsapp-launch-config` | Returns `wa.me` deep-link URL for the website button |
| `GET` | `/whatsapp/precheck-status/:referenceId` | Operator: fetch pre-check data by Reference ID |

---

### Testing without WhatsApp (mock provider)

Set `WHATSAPP_PROVIDER=mock` in `.env`, then POST directly to the webhook:

```bash
curl -X POST http://localhost:4000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"From": "+919876543210", "Body": "hello"}'
```

The response JSON contains the bot `reply` field.

---

### Conversation flow

```
[Any message] → Service menu
      ↓
[1-5 or service name] → Collect data (per-service questions)
      ↓
[Answers] → Confirmation summary
      ↓
[yes] → ✅ Reference ID generated  |  [no] → restart
```

Type **cancel** or **restart** at any time to begin again.

Supported services: Income Certificate, Domicile Certificate, Caste Certificate, Birth Certificate, Marriage Certificate.
