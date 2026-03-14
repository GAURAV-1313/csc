# API Usage (Hackathon)

Base URL: http://localhost:4000

## 1) List Services

GET /services

## 2) Get Service Schema

GET /services/:serviceType

Example:
GET /services/income_certificate

## 3) Create Operator

POST /operators

Body:
{
  "operator_id": "op_001",
  "name": "CSC Operator",
  "district": "Raipur",
  "center_id": "CSC-01"
}

## 4) Create Application Draft

POST /applications

Body:
{
  "serviceType": "income_certificate",
  "citizenData": {
    "applicant_name": "Mahesh Kumar",
    "district": "Raipur"
  }
}

## 5) Validate Application (Full Flow)

POST /validate-application

Example body:

{
  "serviceType": "income_certificate",
  "citizenData": {
    "gender": "male",
    "age_of_beneficiary": 55,
    "beneficiary_guardian_type": "father",
    "beneficiary_guardian_name": "Mahesh Kumar",
    "relation_with_applicant": "self",
    "beneficiary_relative_name": "Mahesh Kumar",
    "caste": "OBC",
    "type": "Urban",
    "class_number": "12",
    "address": "Raipur",
    "pin_code": "492001",
    "district": "Raipur",
    "business_or_service_details": "Shop",
    "reason_for_application": "Scholarship",
    "annual_income": 120000,
    "average_income_last_3_years": 100000,
    "date": "2026-03-14",
    "place": "Raipur",
    "applicant_name": "Mahesh Kumar",
    "signature": "Mahesh Kumar"
  },
  "documents": [
    { "documentType": "affidavit", "sampleId": "aadhaar_sample" },
    { "documentType": "certificate_from_patwari", "sampleId": "income_sample" }
  ]
}

Response includes:
- document_verification
- risk (from ML API if ML_API_URL is configured)
- features used for prediction

## 6) Upload Document + OCR Stub

POST /extract-document

Form-data:
- file: <binary>
- documentType: aadhaar

## 7) Submit Application

POST /applications/:applicationId/submit

## 8) Predict Risk (ML Integration)

POST /predict-risk

Example body:

{
  "features": {
    "service_type": "income_certificate",
    "age": 35,
    "district": "Raipur",
    "annual_income": 120000,
    "missing_documents_count": 1,
    "field_mismatch_count": 0,
    "document_quality_score": 0.85
  }
}

## 9) Get Application

GET /applications/:applicationId

## WhatsApp Bot Integration

The CSC API integrates with an external WhatsApp pre-check bot. Citizens chat with the bot to
complete a pre-check, then share a Reference ID (format: `PC-XXXXXX`) with the CSC operator.
The operator uses these endpoints to fetch the pre-filled data from the bot.

**Required environment variables (bot side):**
```
BOT_API_BASE_URL=https://your-bot-service.example.com
BOT_API_TOKEN=<shared-bearer-token>
```

### 10) Bot Integration Status

GET /whatsapp/bot-status

Returns whether the bot API is configured and reachable.

Example response (configured & reachable):
```json
{
  "configured": true,
  "reachable": true,
  "bot_url": "https://your-bot-service.example.com",
  "message": "Bot API is configured and reachable."
}
```

Example response (not configured):
```json
{
  "configured": false,
  "reachable": false,
  "message": "Bot API is not configured. Set BOT_API_BASE_URL and BOT_API_TOKEN in the environment."
}
```

### 11) Fetch Citizen Pre-check Report by Reference ID

GET /whatsapp-report/:referenceId

Fetches the citizen's pre-check report from the external bot service by Reference ID.

Example:
```
GET /whatsapp-report/PC-0VLTMA
```

Example response:
```json
{
  "reference_id": "PC-0VLTMA",
  "status": "completed",
  "service_type": "income-certificate",
  "completed_at": "2026-03-14T10:00:00Z",
  "citizen_data": {
    "full_name": "Mahesh Kumar",
    "district": "Raipur",
    "annual_income": "120000"
  },
  "documents": [
    { "type": "aadhaar", "status": "available", "label": "Aadhaar Card" }
  ]
}
```

### 12) Fetch Citizen Pre-check Report (POST lookup)

POST /whatsapp-report/lookup

Same as the GET endpoint above but the Reference ID is passed in the request body.

Body:
```json
{ "reference_id": "PC-0VLTMA" }
```

### 13) WhatsApp Launch Config

GET /public/whatsapp-launch-config

Returns the WhatsApp deep-link URL for the citizen-facing "Start on WhatsApp" button.
When `BOT_API_BASE_URL` is configured, the response is proxied from the bot service.

Example response:
```json
{
  "deep_link": "https://wa.me/19312978613?text=START",
  "whatsapp_number": "+19312978613",
  "start_text": "START"
}
```

### 14) WhatsApp Pre-check Status (local store)

GET /whatsapp/precheck-status/:referenceId

Retrieves a pre-check record from the CSC API's local store (populated when the embedded
WhatsApp webhook flow is used instead of an external bot).

### 15) Store Pre-check Record (bot push)

POST /whatsapp-integration/store-precheck

Allows the external WhatsApp pre-check bot to push a completed pre-check record into the
CSC API's local store. Once stored, operators can retrieve it with
`GET /whatsapp/precheck-status/:referenceId` without the bot needing to be reachable.

Authentication: `Authorization: Bearer <CSC_API_BEARER_TOKEN>` (required when
`CSC_API_BEARER_TOKEN` is set in the environment).

Required body fields: `reference_id`, `phone_number`, `service_type`, `precheck_data`

Body:
```json
{
  "reference_id": "PC-0VLTMA",
  "phone_number": "+919876543210",
  "service_type": "income-certificate",
  "precheck_data": {
    "district": "Raipur",
    "annual_income": "120000",
    "purpose": "Scholarship",
    "category": "OBC"
  },
  "required_documents": ["Aadhaar Card", "Ration Card"],
  "eligibility_status": "approved",
  "eligibility_message": "",
  "status": "completed"
}
```

Example response (201 Created):
```json
{ "success": true, "reference_id": "PC-0VLTMA" }
```
