function getRiskTone(level = "") {
  const value = level.toLowerCase();
  if (value.includes("safe") || value.includes("low")) return "safe";
  if (value.includes("medium")) return "medium";
  return "high";
}

type Risk = {
  risk_score?: number;
  risk_level?: string;
};

export default function RiskScoreCard({ risk }: { risk?: Risk }) {
  if (!risk) {
    return (
      <div className="status">
        <span>Risk score pending</span>
      </div>
    );
  }

  const score = Math.round((risk.risk_score ?? 0) * 100);
  const level = risk.risk_level || "UNKNOWN";
  const tone = getRiskTone(level);

  return (
    <div className="risk">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Risk Score</strong>
        <span className={`badge ${tone}`}>{level}</span>
      </div>
      <div style={{ fontSize: "28px", fontWeight: "700" }}>{score}%</div>
      <div className="risk-bar">
        <span
          style={{
            width: `${score}%`,
            background:
              tone === "safe" ? "var(--safe)" : tone === "medium" ? "var(--warning)" : "var(--danger)"
          }}
        />
      </div>
    </div>
  );
}
