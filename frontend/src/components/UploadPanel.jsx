export default function UploadPanel({
  imagePreview,
  siteId,
  dailyLog,
  includeSchedule,
  status,
  error,
  onFile,
  onSiteId,
  onDailyLog,
  onIncludeSchedule,
  onRun,
}) {
  return (
    <div className="card upload-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Input</p>
          <h2>Analyze a site image</h2>
        </div>
        <span className={`pill ${status}`}>{status === 'running' ? 'Running' : status}</span>
      </div>

      <label className="dropzone">
        {imagePreview ? <img src={imagePreview} alt="Uploaded construction site preview" /> : (
          <div>
            <strong>Upload construction site image</strong>
            <span>PNG, JPG, or JPEG</span>
          </div>
        )}
        <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>

      <div className="form-row">
        <label>
          Site ID
          <input value={siteId} onChange={(e) => onSiteId(e.target.value)} />
        </label>
      </div>

      <label>
        Daily log excerpt
        <textarea value={dailyLog} onChange={(e) => onDailyLog(e.target.value)} rows="4" />
      </label>

      <label className="checkbox-row">
        <input type="checkbox" checked={includeSchedule} onChange={(e) => onIncludeSchedule(e.target.checked)} />
        Include sample project schedule
      </label>

      {error && <div className="error-box">{error}</div>}

      <button className="primary-button" onClick={onRun} disabled={status === 'running'}>
        {status === 'running' ? 'Running agents...' : 'Run ConstructGuard Analysis'}
      </button>
    </div>
  );
}
