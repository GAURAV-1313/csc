import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, type RiskPredictionResult } from "../services/api";

type RiskSummaryState = {
  prediction?: RiskPredictionResult;
  applicationId?: string;
  serviceType?: string;
};

function normalizeLevel(level?: string) {
  const value = (level || "").toLowerCase();
  if (value.includes("high")) return "high";
  if (value.includes("med")) return "medium";
  if (value.includes("low") || value.includes("safe")) return "low";
  return "unknown";
}

function getDisplayLevel(level?: string) {
  const normalized = normalizeLevel(level);
  if (normalized === "medium") return "MED";
  if (normalized === "low") return "LOW";
  if (normalized === "high") return "HIGH";
  return "UNKNOWN";
}

export default function RiskSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as RiskSummaryState;
  const prediction = state.prediction || {};
  const levelTone = normalizeLevel(prediction.risk_level);

  const rejectedDisplay = useMemo(() => {
    const value = prediction.rejected_prediction;
    if (value == null) return "No";
    if (typeof value === "number") return value > 0 ? "Yes" : "No";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    const normalized = String(value).trim().toLowerCase();
    if (normalized === "1" || normalized === "true" || normalized === "yes") return "Yes";
    if (normalized === "0" || normalized === "false" || normalized === "no") return "No";
    return "No";
  }, [prediction.rejected_prediction]);

  const handleFinalSubmit = async () => {
    if (!state.applicationId) {
      navigate("/dashboard");
      return;
    }
    try {
      await api.submitApplication(state.applicationId);
      window.location.href = "https://edistrict.cgstate.gov.in";
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    }
  };

  return (
    <div className="page csc-form-page">
      <div className="csc-form-topstrip">
        <div className="shell csc-form-topstrip-inner">
          <div className="csc-top-lang">Select Language</div>
          <div className="csc-top-cta">Continue with Digital India</div>
        </div>
      </div>

      <div className="csc-form-navbar">
        <div className="shell csc-form-navbar-inner">
          <div className="csc-form-brand">
            <div className="csc-form-brand-logo">CSC</div>
            <div>
              <p className="csc-form-brand-title">Common Service Center</p>
              <p className="csc-form-brand-subtitle">Digital Seva Portal</p>
            </div>
          </div>
          <div className="csc-form-nav-actions">
            <button className="btn secondary" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
            <button className="btn" onClick={handleFinalSubmit}>Submit to eDistrict</button>
          </div>
        </div>
      </div>

      <div className="shell csc-form-shell">
        <div className="card csc-risk-card">
          <h1 className="title">Risk Prediction Summary</h1>
          <p className="subtitle">Service: {state.serviceType || "income_certificate"}</p>

          <div className="csc-risk-grid">
            <div className={`csc-risk-item csc-risk-level-${levelTone}`}>
              <span className="csc-risk-label">risk_level</span>
              <strong>{getDisplayLevel(prediction.risk_level)}</strong>
            </div>
            <div className="csc-risk-item">
              <span className="csc-risk-label">rejected_prediction</span>
              <strong>{rejectedDisplay}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
