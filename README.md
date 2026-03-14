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
