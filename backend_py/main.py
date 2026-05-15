import base64
import json
import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from agents.orchestrator import run_all_agents
from camera.manager import camera_manager
from core.schemas import AnalyzePayload, CameraRegisterRequest
from models.gemma_adapter import gemma

load_dotenv()

app = FastAPI(title='ConstructGuard AI Edge Backend', version='2.0.0')

frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/', include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url='/docs')


@app.get('/health')
def health() -> dict[str, Any]:
    return {
        'status': 'ok',
        'version': '2.0.0-python-edge',
        'model_provider': os.getenv('GEMMA_PROVIDER', 'local_hf'),
        'model_id': os.getenv('GEMMA_MODEL_ID', 'google/gemma-3-4b-it'),
        'docs': '/docs',
    }


@app.get('/api/model/status', tags=['model'])
def model_status() -> dict[str, Any]:
    return {'success': True, 'data': gemma.status()}


@app.post('/api/model/load', tags=['model'])
def load_model() -> dict[str, Any]:
    try:
        return {'success': True, 'data': gemma.load_with_timing()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post('/api/model/test-text', tags=['model'])
def test_model_text() -> dict[str, Any]:
    prompt = 'Respond only with valid JSON: {"ok": true, "message": "model is responding"}'
    try:
        result = gemma.analyze_text(prompt)
        return {'success': True, 'data': result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post('/api/analyze')
async def analyze(
    image: UploadFile | None = File(default=None),
    siteId: str = Form(default='unknown-site'),
    dailyLog: str | None = Form(default=None),
    schedule: str | None = Form(default=None),
    weatherData: str | None = Form(default=None),
) -> dict[str, Any]:
    image_base64 = None
    image_mime_type = None
    if image:
        content = await image.read()
        image_base64 = base64.b64encode(content).decode('utf-8')
        image_mime_type = image.content_type
    result = run_all_agents({
        'imageBase64': image_base64,
        'imageMimeType': image_mime_type,
        'dailyLog': dailyLog,
        'weatherData': _parse_json_form(weatherData),
        'schedule': _parse_json_form(schedule),
        'siteId': siteId,
    })
    return {'success': True, 'data': result}


@app.post('/api/analyze-log')
def analyze_log(payload: AnalyzePayload) -> dict[str, Any]:
    result = run_all_agents({
        'siteId': payload.siteId or 'unknown-site',
        'dailyLog': payload.dailyLog,
        'schedule': payload.schedule,
        'weatherData': payload.weatherData,
    })
    return {'success': True, 'data': result}


@app.get('/api/weather')
async def weather(lat: float, lon: float) -> dict[str, Any]:
    url = 'https://api.open-meteo.com/v1/forecast'
    params = {
        'latitude': lat,
        'longitude': lon,
        'current': 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,precipitation_probability',
        'temperature_unit': 'fahrenheit',
        'wind_speed_unit': 'mph',
        'timezone': 'auto',
    }
    async with httpx.AsyncClient(timeout=12) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
    return {'success': True, 'data': data.get('current', {})}


@app.post('/api/cameras')
def register_camera(payload: CameraRegisterRequest) -> dict[str, Any]:
    camera = camera_manager.register(payload.camera_id, payload.rtsp_url, payload.site_id, payload.sample_interval_seconds)
    return {'success': True, 'data': camera}


@app.get('/api/cameras')
def list_cameras() -> dict[str, Any]:
    return {'success': True, 'data': camera_manager.list()}


@app.post('/api/cameras/{camera_id}/start')
def start_camera(camera_id: str) -> dict[str, Any]:
    try:
        return {'success': True, 'data': camera_manager.start(camera_id)}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail='Camera not found') from exc


@app.post('/api/cameras/{camera_id}/stop')
def stop_camera(camera_id: str) -> dict[str, Any]:
    try:
        return {'success': True, 'data': camera_manager.stop(camera_id)}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail='Camera not found') from exc


@app.post('/api/cameras/{camera_id}/snapshot')
async def camera_snapshot(
    camera_id: str,
    image: UploadFile = File(...),
    siteId: str | None = Form(default=None),
    dailyLog: str | None = Form(default=None),
    schedule: str | None = Form(default=None),
    weatherData: str | None = Form(default=None),
) -> dict[str, Any]:
    content = await image.read()
    result = camera_manager.analyze_snapshot(
        camera_id,
        content,
        image.content_type or 'image/jpeg',
        siteId,
        {
            'dailyLog': dailyLog,
            'schedule': _parse_json_form(schedule),
            'weatherData': _parse_json_form(weatherData),
        },
    )
    return {'success': True, 'data': result}


def _parse_json_form(value: str | None) -> Any:
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f'Invalid JSON form field: {value[:60]}') from exc
