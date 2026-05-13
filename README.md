# ConstructGuard AI

A React + Node multi-agent construction safety dashboard.

## What this project does

ConstructGuard AI lets a user upload a construction site image. The backend runs a multi-agent analysis pipeline and returns:

- Site perception findings
- Worker safety findings
- Public safety findings
- Construction progress stage
- Compound risk score
- Recommended immediate and short-term actions
- Weather context

## Folder structure

```text
constructguard-ai/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── agents/
│       ├── actionAgent.js
│       ├── gemmaClient.js
│       ├── orchestrator.js
│       ├── perceptionAgent.js
│       ├── progressAgent.js
│       ├── publicSafetyAgent.js
│       ├── riskAgent.js
│       └── workerSafetyAgent.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── styles.css
│       ├── agents/agentClient.js
│       └── components/
│           ├── ActionPlan.jsx
│           ├── AgentPanel.jsx
│           ├── ReportExport.jsx
│           ├── RiskSummary.jsx
│           ├── UploadPanel.jsx
│           └── WeatherWidget.jsx
└── docs/
    ├── GEMMA4_SETUP.md
    ├── ORIGINAL_PROJECT_GUIDE.md
    └── SETUP.md
```

## Run the backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your API keys
npm run dev
```

Backend runs on `http://localhost:3001`.

## Run the frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Main API flow

The React frontend calls:

- `POST /api/analyze` with an image file and metadata
- `GET /api/weather?lat=41.53&lon=-87.25` for weather context

The backend sends the image and metadata through the agent orchestrator.

## Notes

- The backend logic is kept as close as possible to your original files, but the combined agent file was split into separate files so imports work cleanly.
- The Action Agent has been kept Gemma-centered instead of Claude-centered so the project fits the Gemma hackathon better. If you want the old Claude Action Agent back, replace `backend/agents/actionAgent.js` with your original version.
