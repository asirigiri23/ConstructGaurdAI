export default function ReportExport({ result }) {
  function downloadReport() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.siteId || 'constructguard'}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card export-card">
      <div>
        <p className="eyebrow">Report</p>
        <h2>Export analysis</h2>
        <p>Download the full multi-agent report as JSON for your demo or writeup.</p>
      </div>
      <button className="secondary-button" disabled={!result} onClick={downloadReport}>Download JSON</button>
    </div>
  );
}
