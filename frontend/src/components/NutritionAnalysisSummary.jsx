export default function NutritionAnalysisSummary({ analysis }) {
  if (!analysis) {
    return <p>No nutrition analysis yet.</p>;
  }

  return (
    <div style={{ marginTop: 16, padding: 12, border: "1px solid #ccc" }}>
      <h3>Nutrition Analysis</h3>
      <p>{analysis.summary}</p>
      {analysis.deficiencies && analysis.deficiencies.length > 0 ? (
        <div>
          <h4>Deficiencies:</h4>
          <ul>
            {analysis.deficiencies.map((def, idx) => (
              <li key={idx}>
                <strong>{def.nutrient}</strong> ({def.severity})
                <br />
                Suggested foods: {def.foods?.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {analysis.referral_needed ? (
        <p style={{ color: "crimson" }}>
          <strong>⚠️ Medical referral needed:</strong> {analysis.referral_reason}
        </p>
      ) : null}
    </div>
  );
}
