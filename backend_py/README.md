# ConstructGuard AI Python Edge Backend

FastAPI backend for local laptop/PC edge deployment.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

## Run

```powershell
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```

## Endpoints

- `GET /health`
- `POST /api/analyze` for UI/manual image upload
- `POST /api/analyze-log` for text-only daily logs
- `GET /api/weather?lat=41.53&lon=-87.25`
- `POST /api/cameras` to register an RTSP camera
- `GET /api/cameras` to list cameras
- `POST /api/cameras/{camera_id}/start` to start RTSP polling
- `POST /api/cameras/{camera_id}/stop` to stop RTSP polling
- `POST /api/cameras/{camera_id}/snapshot` for camera/device snapshot uploads

## Local model notes

Set `GEMMA_MODEL_ID` in `.env` to the exact Hugging Face model you want to run locally. Keep `GEMMA_LOAD_ON_STARTUP=false` for faster server startup while testing endpoints. The agents return safe fallback JSON if local inference is not configured yet.
