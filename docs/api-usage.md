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

## 10) List Applications

GET /applications
