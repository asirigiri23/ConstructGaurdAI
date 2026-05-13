function riskClass(level = '') {
  return String(level).toLowerCase();
}

export default function RiskSummary({ result, status }) {
  const risk = result?.agents?.risk;

  if (!result) {
    return (
      <div className="card risk-card empty-state">
        <p className="eyebrow">Command Center</p>
        <h2>{status === 'running' ? 'Agents are analyzing the site...' : 'No analysis yet'}</h2>
        <p>Once you upload an image, the dashboard will show risk score, agent findings, and recommended actions.</p>
      </div>
    );
  }

  return (
    <div className={`card risk-card ${riskClass(risk?.risk_level)}`}>
      <div>
        <p className="eyebrow">Overall Risk</p>
        <h2>{risk?.risk_level || 'Unknown'}</h2>
        <p>{risk?.summary || 'No summary returned.'}</p>
      </div>
      <div className="score-ring">
        <span>{risk?.overall_score ?? '--'}</span>
        <small>/100</small>
      </div>
      <div className="risk-list">
        {(risk?.top_3_risks || []).map((item, index) => (
          <div key={index} className="risk-item">
            <strong>#{index + 1}</strong>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
