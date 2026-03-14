PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS operators (
  operator_id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  district TEXT,
  center_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  service_id TEXT PRIMARY KEY,
  service_name TEXT,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_schemas (
  schema_id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  schema_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(service_id)
);

CREATE TABLE IF NOT EXISTS applications (
  application_id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  citizen_name TEXT,
  district TEXT,
  application_status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (service_id) REFERENCES services(service_id),
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id)
);

CREATE TABLE IF NOT EXISTS application_fields (
  field_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  FOREIGN KEY (application_id) REFERENCES applications(application_id)
);

CREATE TABLE IF NOT EXISTS documents (
  document_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT,
  ocr_text TEXT,
  document_status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(application_id)
);

CREATE TABLE IF NOT EXISTS document_fields (
  field_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(document_id)
);

CREATE TABLE IF NOT EXISTS validation_logs (
  validation_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  validation_type TEXT,
  message TEXT,
  severity TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(application_id)
);

CREATE TABLE IF NOT EXISTS ml_predictions (
  prediction_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  risk_score REAL,
  risk_level TEXT,
  model_version TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(application_id)
);

CREATE TABLE IF NOT EXISTS scheme_recommendations (
  recommendation_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  scheme_name TEXT,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(application_id)
);

CREATE TABLE IF NOT EXISTS document_requirements (
  requirement_id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  document_name TEXT NOT NULL,
  mandatory INTEGER NOT NULL,
  accepted_types TEXT,
  FOREIGN KEY (service_id) REFERENCES services(service_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_service ON applications(service_id);
CREATE INDEX IF NOT EXISTS idx_applications_operator ON applications(operator_id);
CREATE INDEX IF NOT EXISTS idx_documents_application ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_document_fields_document ON document_fields(document_id);
CREATE INDEX IF NOT EXISTS idx_fields_application ON application_fields(application_id);
CREATE INDEX IF NOT EXISTS idx_predictions_application ON ml_predictions(application_id);
