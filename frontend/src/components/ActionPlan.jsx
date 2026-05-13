export default function ActionPlan({ data, risk }) {
  const immediate = data?.immediate_actions || [];
  const shortTerm = data?.short_term_actions || [];

  return (
    <div className="card action-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Action Agent</p>
          <h2>Recommended next steps</h2>
        </div>
        <span className="mini-pill">{risk?.risk_level || 'pending'}</span>
      </div>

      {!data ? (
        <p>Run an analysis to generate prioritized actions.</p>
      ) : (
        <>
          <p className="summary-line">{data.summary}</p>
          <h3>Immediate actions</h3>
          <div className="action-list">
            {immediate.map((item, index) => (
              <div key={index} className="action-item">
                <strong>P{item.priority || index + 1}</strong>
                <div>
                  <p>{item.action}</p>
                  <small>{item.who} · {item.why}</small>
                  {item.osha_reference && <small>OSHA: {item.osha_reference}</small>}
                </div>
              </div>
            ))}
          </div>

          <h3>Short-term actions</h3>
          <div className="action-list subtle">
            {shortTerm.map((item, index) => (
              <div key={index} className="action-item">
                <strong>P{item.priority || index + 4}</strong>
                <div>
                  <p>{item.action}</p>
                  <small>{item.deadline} · {item.who}</small>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
