function getRiskTone(level = "") {
  const value = level.toLowerCase();
  if (value.includes("safe") || value.includes("low")) return "safe";
  if (value.includes("medium")) return "medium";
  return "high";
}

type Risk = {
  risk_score?: number;
  risk_level?: string;
  rejected_prediction?: boolean | number;
};

export default function RiskScoreCard({ risk }: { risk?: Risk }) {
  if (!risk) {
    return (
      <div className="status">
        <span>Risk assessment pending</span>
      </div>
    );
  }

  const level = risk.risk_level || "UNKNOWN";
  const tone = getRiskTone(level);
  const rejected = risk.rejected_prediction;
  const rejectedDisplay = rejected === undefined || rejected === null
    ? "No"
    : Number(rejected) > 0 || rejected === true
      ? "Yes"
      : "No";

  return (
    <div className="risk">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Risk Assessment</strong>
        <span className={`badge ${tone}`}>{level}</span>
      </div>
      <div style={{ marginTop: "8px", fontWeight: "600" }}>
        Rejected Prediction: {rejectedDisplay}
      </div>
    </div>
  );
}
