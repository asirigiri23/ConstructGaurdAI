import time
from datetime import datetime, timezone
from typing import Any

from agents.action_agent import run_action_agent
from agents.perception_agent import run_perception_agent
from agents.progress_agent import run_progress_agent
from agents.public_safety_agent import run_public_safety_agent
from agents.risk_agent import run_risk_agent
from agents.worker_safety_agent import run_worker_safety_agent


def run_all_agents(input_data: dict[str, Any]) -> dict[str, Any]:
    start = time.perf_counter()
    image_base64 = input_data.get('imageBase64')
    image_mime_type = input_data.get('imageMimeType')
    daily_log = input_data.get('dailyLog')
    weather_data = input_data.get('weatherData')
    schedule = input_data.get('schedule')
    site_id = input_data.get('siteId') or 'unknown-site'

    perception = run_perception_agent(image_base64, image_mime_type)
    worker_safety = run_worker_safety_agent(image_base64, image_mime_type)
    public_safety = run_public_safety_agent(image_base64, image_mime_type)
    progress = run_progress_agent(image_base64, image_mime_type, daily_log, schedule)
    risk_result = run_risk_agent(perception, worker_safety, public_safety, progress, weather_data)
    action_result = run_action_agent(perception, worker_safety, public_safety, progress, risk_result, weather_data, schedule)

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    return {
        'siteId': site_id,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'analysisTimeMs': elapsed_ms,
        'agents': {
            'perception': perception,
            'worker_safety': worker_safety,
            'public_safety': public_safety,
            'progress': progress,
            'risk': risk_result,
            'actions': action_result,
        },
    }
