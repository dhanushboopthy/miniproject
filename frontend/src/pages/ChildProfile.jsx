import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import GrowthChart from "../components/GrowthChart.jsx";
import NutritionAnalysisSummary from "../components/NutritionAnalysisSummary.jsx";
import { fetchGrowthChart, fetchLatestMeasurement } from "../api/growthApi.js";
import { fetchNutritionHistory } from "../api/nutritionApi.js";
import api from "../api/axiosClient.js";

export default function ChildProfile() {
  const { id } = useParams();
  const [child, setChild] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [recentNutrition, setRecentNutrition] = useState(null);

  useEffect(() => {
    api.get(`/children/${id}`).then((res) => setChild(res.data));
    fetchGrowthChart(id).then(setChartData).catch(() => setChartData([]));
    fetchLatestMeasurement(id).then(setLatest).catch(() => setLatest(null));
    fetchNutritionHistory(id)
      .then((logs) => {
        const withAnalysis = logs.find((log) => log.ai_analysis);
        setRecentNutrition(withAnalysis?.ai_analysis);
      })
      .catch(() => setRecentNutrition(null));
  }, [id]);

  return (
    <div className="page">
      <h1>Child Profile</h1>
      {child ? (
        <div className="card">
          <p>
            <strong>{child.name}</strong> ({child.child_id})
          </p>
          <p>AWC: {child.awc_code}</p>
        </div>
      ) : null}
      {latest ? (
        <p>
          Latest status: <strong>{latest.status}</strong>
        </p>
      ) : null}
      <GrowthChart data={chartData} />
      <NutritionAnalysisSummary analysis={recentNutrition} />
    </div>
  );
}
