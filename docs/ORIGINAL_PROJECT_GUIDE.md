# ConstructGuard AI — Full Project Guide

## What You Have vs What You Still Need

### ✅ DONE (in this package)
- Frontend dashboard (React + Tailwind)
- Multi-agent orchestration logic
- Claude Sonnet integration (works RIGHT NOW)
- Weather API integration (free, no key)
- File upload + image analysis pipeline
- Report generation system

### 🔲 STILL NEEDED
- Gemma 4 setup (Google AI Studio or local Ollama)
- Real CCTV / camera feed integration
- Database (PostgreSQL or Supabase)
- Auth system (for site supervisors)
- Mobile app (React Native)
- Deployment (Vercel frontend + Railway backend)

---

## Tech Stack

```
Frontend:   React + Vite + Tailwind CSS
Backend:    Node.js + Express
AI Models:  Gemma 4 (vision agents) + Claude Sonnet (orchestrator)
Weather:    Open-Meteo API (FREE, no key needed)
Database:   PostgreSQL (Supabase recommended)
Storage:    Cloudinary or AWS S3 (site images/video)
```

---

## Project Structure

```
constructguard/
├── frontend/
│   ├── src/
│   │   ├── App.jsx              ← Main dashboard
│   │   ├── components/
│   │   │   ├── SiteMap.jsx
│   │   │   ├── AgentPanel.jsx
│   │   │   ├── WeatherWidget.jsx
│   │   │   ├── ActionPlan.jsx
│   │   │   └── ReportExport.jsx
│   │   └── agents/
│   │       └── agentClient.js   ← Calls backend agents
│   └── package.json
├── backend/
│   ├── server.js                ← Express server
│   ├── agents/
│   │   ├── orchestrator.js      ← Runs all 6 agents
│   │   ├── perceptionAgent.js   ← Gemma 4 vision
│   │   ├── workerSafetyAgent.js ← Gemma 4 + rules
│   │   ├── publicSafetyAgent.js ← Gemma 4 vision
│   │   ├── progressAgent.js     ← Claude analysis
│   │   ├── riskAgent.js         ← Aggregator
│   │   └── actionAgent.js       ← Claude planner
│   ├── routes/
│   │   ├── analyze.js
│   │   ├── weather.js
│   │   └── report.js
│   └── utils/
│       ├── weatherFetch.js
│       └── reportGenerator.js
└── docs/
    ├── GEMMA4_SETUP.md
    └── DATASETS.md
```
