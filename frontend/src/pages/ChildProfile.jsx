import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import GrowthChart from "../components/GrowthChart.jsx";
import NutritionAnalysisSummary from "../components/NutritionAnalysisSummary.jsx";
import { fetchGrowthChart, fetchLatestMeasurement } from "../api/growthApi.js";
import { fetchNutritionHistory } from "../api/nutritionApi.js";
import { alertsApi } from "../api/alertsApi.js";
import api from "../api/axiosClient.js";

const STATUS_STYLE = {
  SAM: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  MAM: { bg: "#fed7aa", text: "#92400e", border: "#fdba74" },
  Normal: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 14px",
        backgroundColor: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        borderRadius: "14px",
        fontSize: "14px",
        fontWeight: "700",
      }}
    >
      {status || "Not measured"}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ width: "160px", flexShrink: 0, color: "#6b7280", fontSize: "14px" }}>{label}</span>
      <span style={{ fontWeight: "500", fontSize: "14px" }}>{value || "—"}</span>
    </div>
  );
}

function AlertSeverityDot({ severity }) {
  const colors = {
    critical: "#dc2626",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        backgroundColor: colors[severity] || "#6b7280",
        marginRight: "6px",
        flexShrink: 0,
      }}
    />
  );
}

export default function ChildProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [child, setChild] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [recentNutrition, setRecentNutrition] = useState(null);
  const [nutritionPending, setNutritionPending] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let retries = 0;
    let timer = null;

    const loadNutrition = async () => {
      try {
        const logs = await fetchNutritionHistory(id);
        const withAnalysis = logs.find((log) => log.ai_analysis);
        if (withAnalysis) {
          setRecentNutrition(withAnalysis.ai_analysis);
          setNutritionPending(false);
          return;
        }
        setRecentNutrition(null);
        setNutritionPending(logs.length > 0);
        if (logs.length > 0 && retries < 3) {
          retries += 1;
          timer = setTimeout(loadNutrition, 4000);
        }
      } catch {
        setRecentNutrition(null);
        setNutritionPending(false);
      }
    };

    api
      .get(`/children/${id}`)
      .then((res) => setChild(res.data))
      .finally(() => setLoading(false));

    fetchGrowthChart(id).then(setChartData).catch(() => setChartData([]));
    fetchLatestMeasurement(id).then(setLatest).catch(() => setLatest(null));
    loadNutrition();

    alertsApi
      .getChildAlerts(id)
      .then((res) => setAlerts(res.data))
      .catch(() => setAlerts([]))
      .finally(() => setAlertsLoading(false));

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN");
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "—";
    const diff = Date.now() - new Date(dob).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    if (months < 24) return `${months} months`;
    return `${Math.floor(months / 12)} years ${months % 12} months`;
  };

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "24px" }}>
        <div>
          <button
            onClick={() => navigate("/children")}
            style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              cursor: "pointer",
              fontSize: "14px",
              padding: "0 0 8px 0",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ← Back to Children
          </button>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700" }}>
            {loading ? "Loading..." : child?.name || "Child Profile"}
          </h1>
          {child && (
            <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontFamily: "monospace", fontSize: "14px" }}>
              {child.child_id}
            </p>
          )}
        </div>
        {latest && (
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>Current Status</p>
            <StatusBadge status={latest.status || latest.wfh_status} />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px", flexWrap: "wrap" }}>
        {[
          { label: "⚖️ Log Measurement", path: `/growth/new?child=${id}`, bg: "#eff6ff", color: "#1d4ed8" },
          { label: "🍎 Log Diet", path: `/nutrition/log?child=${id}`, bg: "#fdf4ff", color: "#7e22ce" },
          { label: "🥗 Meal Plan", path: `/mealplan/${id}`, bg: "#f0fdf4", color: "#15803d" },
        ].map(({ label, path, bg, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              padding: "10px 18px",
              backgroundColor: bg,
              color,
              border: `1px solid ${color}30`,
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Child Details */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>Child Information</h3>
          {child ? (
            <>
              <InfoRow label="Full Name" value={child.name} />
              <InfoRow label="Date of Birth" value={formatDate(child.dob)} />
              <InfoRow label="Age" value={calculateAge(child.dob)} />
              <InfoRow label="Gender" value={child.gender ? child.gender.charAt(0).toUpperCase() + child.gender.slice(1) : "—"} />
              <InfoRow label="AWC Code" value={child.awc_code} />
              <InfoRow label="Enrolled" value={formatDate(child.created_at)} />
            </>
          ) : (
            <p style={{ color: "#6b7280" }}>Loading...</p>
          )}
        </div>

        {/* Parent Details */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>Parent / Guardian</h3>
          {child ? (
            <>
              <InfoRow label="Parent Name" value={child.parent_name} />
              <InfoRow label="Contact" value={child.parent_contact} />
            </>
          ) : (
            <p style={{ color: "#6b7280" }}>Loading...</p>
          )}

          {latest && (
            <>
              <h3 style={{ margin: "20px 0 16px 0", fontSize: "16px", fontWeight: "600" }}>Latest Measurement</h3>
              <InfoRow label="Date" value={formatDate(latest.measurement_date)} />
              <InfoRow label="Weight" value={latest.weight_kg ? `${latest.weight_kg} kg` : "—"} />
              <InfoRow label="Height" value={latest.height_cm ? `${latest.height_cm} cm` : "—"} />
              <InfoRow label="MUAC" value={latest.muac_cm ? `${latest.muac_cm} cm` : "—"} />
              {latest.z_scores && (
                <InfoRow
                  label="Z-scores"
                  value={`WAZ: ${latest.z_scores.waz?.toFixed(2) ?? "—"} | WHZ: ${latest.z_scores.whz?.toFixed(2) ?? "—"}`}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Growth Chart */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>Growth Chart</h3>
        <GrowthChart data={chartData} />
      </div>

      {/* Nutrition Analysis */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>AI Nutrition Analysis</h3>
        <NutritionAnalysisSummary analysis={recentNutrition} pending={nutritionPending} />
      </div>

      {/* Alert History */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>Alert History</h3>
        {alertsLoading ? (
          <p style={{ color: "#6b7280" }}>Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <div
            style={{
              padding: "24px",
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            No alerts for this child.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <AlertSeverityDot severity={alert.severity} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 4px 0", fontWeight: "500" }}>{alert.message}</p>
                  <p style={{ margin: 0, color: "#9ca3af", fontSize: "12px" }}>
                    {formatDate(alert.created_at)} ·{" "}
                    <span
                      style={{
                        color:
                          alert.status === "resolved"
                            ? "#16a34a"
                            : alert.status === "acknowledged"
                            ? "#d97706"
                            : "#dc2626",
                        fontWeight: "600",
                        textTransform: "capitalize",
                      }}
                    >
                      {alert.status}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
