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
  const [nutritionPending, setNutritionPending] = useState(false);

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

    api.get(`/children/${id}`).then((res) => setChild(res.data));
    fetchGrowthChart(id).then(setChartData).catch(() => setChartData([]));
    fetchLatestMeasurement(id).then(setLatest).catch(() => setLatest(null));
    loadNutrition();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
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
      <NutritionAnalysisSummary analysis={recentNutrition} pending={nutritionPending} />
    </div>
  );
}
