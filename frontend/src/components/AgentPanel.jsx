function summarize(data) {
  if (!data) return 'Waiting for analysis.';
  if (data.error) return data.summary || data.error;
  return data.summary || JSON.stringify(data).slice(0, 160);
}

export default function AgentPanel({ title, data, accent }) {
  return (
    <div className={`card agent-card ${accent}`}>
      <div className="card-header compact">
        <h3>{title}</h3>
        {data?.error ? <span className="mini-pill error">failed</span> : <span className="mini-pill">agent</span>}
      </div>
      <p>{summarize(data)}</p>
      {data && (
        <details>
          <summary>View JSON</summary>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
