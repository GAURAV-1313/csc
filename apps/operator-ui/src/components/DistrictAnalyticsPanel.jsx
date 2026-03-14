import { memo, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function DistrictAnalyticsPanel({ district }) {
  const metrics = useMemo(() => {
    const totalApplications = Number(district?.totalApplications || 0);
    const totalRejected = Number(district?.totalRejected || 0);
    const approvalRate = totalApplications > 0
      ? Math.max(0, Math.round(((totalApplications - totalRejected) / totalApplications) * 100))
      : 0;
    const rejectionRate = totalApplications > 0
      ? Math.round((totalRejected / totalApplications) * 100)
      : 0;

    const serviceNames = (district?.services || []).map((service) => service.serviceName);
    const serviceRejectedCounts = (district?.services || []).map((service) => Number(service.rejected || 0));

    const reasonMap = new Map();
    (district?.services || []).forEach((service) => {
      (service.reasons || []).forEach((item) => {
        const key = item.reason;
        const value = Number(item.count || 0);
        reasonMap.set(key, (reasonMap.get(key) || 0) + value);
      });
    });

    const topReasons = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalApplications,
      totalRejected,
      approvalRate,
      rejectionRate,
      serviceNames,
      serviceRejectedCounts,
      topReasons
    };
  }, [district]);

  const chartData = useMemo(() => ({
    labels: metrics.serviceNames,
    datasets: [
      {
        label: "Rejected Applications",
        data: metrics.serviceRejectedCounts,
        borderRadius: 8,
        backgroundColor: "rgba(239, 68, 68, 0.75)",
        borderColor: "rgba(220, 38, 38, 1)",
        borderWidth: 1
      }
    ]
  }), [metrics.serviceNames, metrics.serviceRejectedCounts]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 }
      }
    }
  }), []);

  const topService = district?.services?.[0]
    ? [...district.services].sort((a, b) => Number(b.rejected || 0) - Number(a.rejected || 0))[0]
    : null;

  return (
    <aside className="heatmap-panel">
      <div className="heatmap-panel-title">District Analytics</div>
      <h3>{district?.name || "Select a district"}</h3>

      <div className="heatmap-summary-grid">
        <div>
          <p className="heatmap-kpi-label">Total Applications</p>
          <p className="heatmap-kpi-value">{metrics.totalApplications}</p>
        </div>
        <div>
          <p className="heatmap-kpi-label">Total Rejected</p>
          <p className="heatmap-kpi-value">{metrics.totalRejected}</p>
        </div>
        <div>
          <p className="heatmap-kpi-label">Approval Rate</p>
          <p className="heatmap-kpi-value">{metrics.approvalRate}%</p>
        </div>
        <div>
          <p className="heatmap-kpi-label">Rejection Rate</p>
          <p className="heatmap-kpi-value">{metrics.rejectionRate}%</p>
        </div>
      </div>

      <div className="heatmap-section">
        <h4>Service-wise Rejections</h4>
        <div className="heatmap-chart-wrap">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="heatmap-section">
        <h4>Top Rejection Reasons</h4>
        <ul className="heatmap-reasons-list">
          {metrics.topReasons.length === 0 && <li>No rejection reasons available.</li>}
          {metrics.topReasons.map((item) => (
            <li key={item.reason}>
              <span>{item.reason}</span>
              <strong>{item.count}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="heatmap-insight-box">
        <h4>AI Insight</h4>
        <p>
          {topService
            ? `Most rejections in ${district.name} are occurring in ${topService.serviceName} applications due to missing or inconsistent supporting documents.`
            : "No district selected. Click a district to view rejection insights."}
        </p>
      </div>
    </aside>
  );
}

export default memo(DistrictAnalyticsPanel);
