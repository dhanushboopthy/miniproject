import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMealPlan, generateMealPlan } from "../api/nutritionApi.js";

const DAY_COLORS = [
  { bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb" },
  { bg: "#f0fdf4", border: "#bbf7d0", accent: "#16a34a" },
  { bg: "#fef3c7", border: "#fde68a", accent: "#d97706" },
  { bg: "#fce7f3", border: "#fbcfe8", accent: "#be185d" },
  { bg: "#f5f3ff", border: "#ddd6fe", accent: "#7c3aed" },
  { bg: "#fff7ed", border: "#fed7aa", accent: "#c2410c" },
  { bg: "#f0fdfa", border: "#99f6e4", accent: "#0f766e" },
];

const MEAL_ICONS = {
  breakfast: "🌅",
  lunch: "☀️",
  snack: "🍌",
  dinner: "🌙",
};

function MealRow({ meal, value }) {
  return (
    <div style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <span style={{ width: "80px", flexShrink: 0, fontSize: "13px", color: "#6b7280", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
        {MEAL_ICONS[meal]} {meal.charAt(0).toUpperCase() + meal.slice(1)}
      </span>
      <span style={{ fontSize: "14px", color: "#1f2937" }}>{value || "—"}</span>
    </div>
  );
}

export default function MealPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchMealPlan(id).then(setPlan).catch(() => setPlan(null));
  }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage({ text: "", type: "" });
    try {
      const weekStart = new Date().toISOString().split("T")[0];
      const newPlan = await generateMealPlan({ child_id: id, week_start: weekStart });
      setPlan(newPlan);
      setMessage({ text: "✅ Meal plan generated successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || "Failed to generate meal plan.", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "24px" }}>
        <div>
          <button
            onClick={() => navigate(`/children/${id}`)}
            style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "14px", padding: "0 0 8px 0" }}
          >
            ← Back to Profile
          </button>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700" }}>🥗 Meal Plan</h1>
          <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
            AI-generated 7-day nutrition plan using ICDS guidelines
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {plan && (
            <button
              onClick={handlePrint}
              style={{
                padding: "10px 18px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              🖨️ Print
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: "10px 18px",
              backgroundColor: generating ? "#9ca3af" : "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: generating ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            {generating ? "Generating..." : plan ? "↺ Regenerate" : "✨ Generate Plan"}
          </button>
        </div>
      </div>

      {message.text && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "6px",
            backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#166534" : "#991b1b",
            borderLeft: `4px solid ${message.type === "success" ? "#22c55e" : "#dc2626"}`,
            fontSize: "14px",
          }}
        >
          {message.text}
        </div>
      )}

      {!plan && !generating && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 40px",
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
            border: "2px dashed #d1d5db",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🥗</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>No meal plan yet</h3>
          <p style={{ margin: "0 0 20px 0", color: "#6b7280", fontSize: "14px" }}>
            Generate an AI-powered 7-day meal plan tailored to this child's nutritional needs
          </p>
          <button
            onClick={handleGenerate}
            style={{
              padding: "12px 28px",
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            ✨ Generate Meal Plan
          </button>
        </div>
      )}

      {generating && (
        <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>⏳</div>
          <p>Generating personalized meal plan with AI...</p>
        </div>
      )}

      {plan && (
        <>
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#15803d", fontSize: "14px", fontWeight: "600" }}>
              📅 Week starting {formatDate(plan.week_start)}
            </span>
            <span style={{ color: "#6b7280", fontSize: "13px" }}>
              {plan.generated_by === "AI" ? "🤖 AI Generated" : "Generated"} • {plan.days?.length || 0} days
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {(plan.days || []).map((day, idx) => {
              const colors = DAY_COLORS[idx % DAY_COLORS.length];
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      backgroundColor: colors.accent,
                      color: "white",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{day.day}</h3>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <MealRow meal="breakfast" value={day.breakfast} />
                    <MealRow meal="lunch" value={day.lunch} />
                    <MealRow meal="snack" value={day.snack} />
                    <MealRow meal="dinner" value={day.dinner} />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#92400e",
            }}
          >
            <strong>Note:</strong> This meal plan is based on ICDS supplementary nutrition guidelines and locally available
            Tamil Nadu foods (ragi, moringa, horsegram, sesame, drumstick). Adjust portions based on child's appetite and
            growth status.
          </div>
        </>
      )}
    </div>
  );
}
