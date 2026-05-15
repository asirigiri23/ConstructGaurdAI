import json
from typing import Any

from models.gemma_adapter import gemma


def build_prompt(daily_log: str | None, schedule: dict[str, Any] | None) -> str:
    return f'''You are the Construction Progress Agent for ConstructGuard AI.
Daily log excerpt: {daily_log or 'Not provided'}
Project schedule: {json.dumps(schedule) if schedule else 'Not provided'}
Analyze the image or text and classify construction progress.
Respond only with valid JSON:
{{
  "current_stage": "stage name",
  "stage_number": 1,
  "estimated_completion_percent": 0,
  "visual_evidence": [],
  "completed_stages": [],
  "upcoming_milestone": "next milestone",
  "schedule_status": "ahead|on_track|behind",
  "days_behind_or_ahead": 0,
  "summary": "one sentence"
}}'''


def fallback(message: str = 'Progress could not be determined') -> dict[str, Any]:
    return {
        'current_stage': 'Unknown',
        'stage_number': 0,
        'estimated_completion_percent': 0,
        'visual_evidence': [],
        'completed_stages': [],
        'upcoming_milestone': 'Unknown',
        'schedule_status': 'on_track',
        'days_behind_or_ahead': 0,
        'summary': message,
    }


def run_progress_agent(image_base64: str | None, image_mime_type: str | None, daily_log: str | None, schedule: dict[str, Any] | None) -> dict[str, Any]:
    prompt = build_prompt(daily_log, schedule)
    try:
        if image_base64:
            return gemma.analyze_image(image_base64, image_mime_type or 'image/jpeg', prompt)
        return gemma.analyze_text(prompt)
    except Exception as exc:
        data = fallback('Progress agent used fallback output')
        data['error'] = str(exc)
        return data
