import { useMemo, useState } from 'react';
import { analyzeImage, fetchSiteWeather } from './agents/agentClient.js';
import UploadPanel from './components/UploadPanel.jsx';
import RiskSummary from './components/RiskSummary.jsx';
import AgentPanel from './components/AgentPanel.jsx';
import ActionPlan from './components/ActionPlan.jsx';
import WeatherWidget from './components/WeatherWidget.jsx';
import ReportExport from './components/ReportExport.jsx';

const sampleSchedule = {
  project: 'Downtown sidewalk + exterior renovation',
  planned_stage: 'Framing',
  planned_completion_percent: 45,
  deadline: '2026-05-18',
};

export default function App() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [siteId, setSiteId] = useState('site-a');
  const [dailyLog, setDailyLog] = useState('Crew working near public sidewalk. Exterior framing and temporary barriers installed.');
  const [includeSchedule, setIncludeSchedule] = useState(true);
  const [weather, setWeather] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const agents = result?.agents || {};

  const metadata = useMemo(() => ({
    siteId,
    dailyLog,
    schedule: includeSchedule ? sampleSchedule : null,
  }), [siteId, dailyLog, includeSchedule]);

  function handleFile(file) {
    setImageFile(file);
    setResult(null);
    setError('');
    if (file) setImagePreview(URL.createObjectURL(file));
  }

  async function runAnalysis() {
    if (!imageFile) {
      setError('Upload a construction site image first.');
      return;
    }

    setStatus('running');
    setError('');
    setResult(null);

    try {
      const [analysis, wx] = await Promise.all([
        analyzeImage(imageFile, metadata),
        fetchSiteWeather().catch(() => null),
      ]);
      setResult(analysis);
      setWeather(wx);
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Analysis failed. Check backend logs and API keys.');
      setStatus('error');
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Multi-agent construction intelligence</p>
          <h1>ConstructGuard AI</h1>
          <p className="hero-copy">
            Upload a site image and let Gemma-powered agents inspect worker safety,
            public safety, construction progress, compound risk, and next actions.
          </p>
        </div>
        <div className="hero-card">
          <span>Agents</span>
          <strong>6</strong>
          <small>Perception · Worker · Public · Progress · Risk · Action</small>
        </div>
      </header>

      <main className="grid-layout">
        <section className="left-column">
          <UploadPanel
            imagePreview={imagePreview}
            siteId={siteId}
            dailyLog={dailyLog}
            includeSchedule={includeSchedule}
            status={status}
            error={error}
            onFile={handleFile}
            onSiteId={setSiteId}
            onDailyLog={setDailyLog}
            onIncludeSchedule={setIncludeSchedule}
            onRun={runAnalysis}
          />
          <WeatherWidget weather={weather} />
        </section>

        <section className="right-column">
          <RiskSummary result={result} status={status} />
          <div className="agent-grid">
            <AgentPanel title="Perception Agent" data={agents.perception} accent="blue" />
            <AgentPanel title="Worker Safety Agent" data={agents.worker_safety} accent="orange" />
            <AgentPanel title="Public Safety Agent" data={agents.public_safety} accent="purple" />
            <AgentPanel title="Progress Agent" data={agents.progress} accent="green" />
          </div>
          <ActionPlan data={agents.actions} risk={agents.risk} />
          <ReportExport result={result} />
        </section>
      </main>
    </div>
  );
}
