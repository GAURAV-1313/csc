# SQLite Query Examples

## Full application record (all related data)

SELECT a.*, 
       f.field_name, f.field_value,
       d.document_type, d.document_status,
       v.validation_type, v.message, v.severity,
       p.risk_score, p.risk_level,
       r.scheme_name, r.reason
FROM applications a
LEFT JOIN application_fields f ON f.application_id = a.application_id
LEFT JOIN documents d ON d.application_id = a.application_id
LEFT JOIN validation_logs v ON v.application_id = a.application_id
LEFT JOIN ml_predictions p ON p.application_id = a.application_id
LEFT JOIN scheme_recommendations r ON r.application_id = a.application_id
WHERE a.application_id = 'APP_001';

## Applications by service

SELECT * FROM applications WHERE service_id = 'income_certificate';

## Applications by operator

SELECT * FROM applications WHERE operator_id = 'OP_001';
