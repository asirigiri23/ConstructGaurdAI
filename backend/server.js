import 'dotenv/config';
// backend/server.js
// ConstructGuard AI — Express Server
// Run with: node server.js (or: npm run dev)

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { runAllAgents } from './agents/orchestrator.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));

// Multer for file uploads (stores in memory, not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// ──────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() });
});

// Main analysis endpoint — accepts image upload
// POST /api/analyze
// Body: multipart/form-data with 'image' file field
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const { siteId, dailyLog, schedule, weatherData } = req.body;

    let imageBase64 = null;
    let imageMimeType = null;

    if (file) {
      imageBase64 = file.buffer.toString('base64');
      imageMimeType = file.mimetype;
    }

    // Parse schedule and weather if provided as JSON strings
    const parsedSchedule = schedule ? JSON.parse(schedule) : null;
    const parsedWeather = weatherData ? JSON.parse(weatherData) : null;

    const result = await runAllAgents({
      imageBase64,
      imageMimeType,
      dailyLog,
      weatherData: parsedWeather,
      schedule: parsedSchedule,
      siteId: siteId || 'unknown-site',
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Server] Analysis error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Weather endpoint — proxies Open-Meteo for your site's coordinates
// GET /api/weather?lat=41.53&lon=-87.25
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,precipitation_probability&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const r = await fetch(url);
    const data = await r.json();
    res.json({ success: true, data: data.current });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Text-only analysis (for daily logs without images)
// POST /api/analyze-log
// Body: { siteId, dailyLog, schedule, weatherData }
app.post('/api/analyze-log', async (req, res) => {
  try {
    const { siteId, dailyLog, schedule, weatherData } = req.body;
    const result = await runAllAgents({ siteId, dailyLog, schedule, weatherData });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🏗  ConstructGuard AI Server running on http://localhost:${PORT}`);
  console.log(`📡 Gemma Provider: ${process.env.GEMMA_PROVIDER || 'google'}`);
  console.log(`🤖 Anthropic key:  ${process.env.ANTHROPIC_API_KEY ? '✓ set' : '✗ MISSING'}`);
  console.log(`🌍 Google AI key:  ${process.env.GOOGLE_AI_API_KEY ? '✓ set' : '✗ not set (ok if using Ollama)'}\n`);
});
