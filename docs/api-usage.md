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

## 11) WhatsApp Pre-check Bot

### Webhook verification (Meta only)

GET /whatsapp/webhook?hub.mode=subscribe&hub.verify_token=<META_VERIFY_TOKEN>&hub.challenge=<CHALLENGE>

Response (200): `<CHALLENGE>` (plain text)

### Incoming message (Twilio)

POST /whatsapp/webhook

Body (form-encoded, sent by Twilio):
```
From=whatsapp%3A%2B919876543210
Body=Hello
```

Response (200): TwiML XML with bot reply.

### Incoming message (Meta Cloud API)

POST /whatsapp/webhook

Body: Meta webhook JSON payload.

Response (200): empty body. Reply is sent to the user via Meta Messaging API.

### Incoming message (mock — for local testing)

POST /whatsapp/webhook

Body:
```json
{ "From": "+919876543210", "Body": "1" }
```

Response:
```json
{ "reply": "Great! You selected Income Certificate.\n\nPlease enter your full name:" }
```

### Launch config (website button)

GET /public/whatsapp-launch-config

Response:
```json
{
  "provider": "twilio",
  "whatsapp_url": "https://wa.me/14155238886?text=Hi%21...",
  "phone_number": "14155238886",
  "greeting_message": "Hi! I would like to start a pre-check for a CSC service.",
  "instructions": "Click the link above to open WhatsApp and begin your pre-check conversation."
}
```

### Retrieve pre-check by Reference ID (operator)

GET /whatsapp/precheck-status/REF-LHJ42A-3F9C12

Response:
```json
{
  "reference_id": "REF-LHJ42A-3F9C12",
  "phone_number": "+919876543210",
  "service_type": "income_certificate",
  "precheck_data": {
    "applicant_name": "Mahesh Kumar",
    "age_of_beneficiary": "35",
    "annual_income": "120000",
    "district": "Raipur",
    "address": "123 Main Road, Raipur"
  },
  "status": "completed",
  "created_at": "2026-03-14T10:00:00.000Z",
  "updated_at": "2026-03-14T10:05:00.000Z"
}
```
