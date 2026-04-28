import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchMealPlan, generateMealPlan } from "../api/nutritionApi.js";

export default function MealPlan() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMealPlan(id).then(setPlan).catch(() => setPlan(null));
  }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage("");
    try {
      const weekStart = new Date().toISOString().split("T")[0];
      const newPlan = await generateMealPlan({
        child_id: id,
        week_start: weekStart,
      });
      setPlan(newPlan);
      setMessage("Meal plan generated!");
    } catch (err) {
      setMessage("Failed to generate meal plan.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page">
      <h1>Meal Plan</h1>
      {message ? <p>{message}</p> : null}
      <button onClick={handleGenerate} disabled={generating}>
        {generating ? "Generating..." : "Generate Meal Plan"}
      </button>
      {plan ? (
        <div>
          <h2>Week of {plan.week_start}</h2>
          {plan.days.map((day, idx) => (
            <div key={idx} style={{ marginBottom: 24, border: "1px solid #ddd", padding: 12 }}>
              <h3>{day.day}</h3>
              <p>
                <strong>Breakfast:</strong> {day.breakfast}
              </p>
              <p>
                <strong>Lunch:</strong> {day.lunch}
              </p>
              <p>
                <strong>Snack:</strong> {day.snack}
              </p>
              <p>
                <strong>Dinner:</strong> {day.dinner}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
