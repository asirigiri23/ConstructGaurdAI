from typing import Any

from models.gemma_adapter import gemma

PUBLIC_SAFETY_PROMPT = '''You are the Public Safety Agent for ConstructGuard AI.
Analyze this construction site image for risks to pedestrians, cyclists, drivers, and nearby public areas.
Respond only with valid JSON:
{
  "pedestrians_detected": { "count": 0, "too_close_to_site": false },
  "pedestrian_risks": [],
  "vehicle_risks": [],
  "barrier_status": { "hoarding_complete": false, "cones_adequate": false, "signage_adequate": false, "lighting_adequate": false },
  "sidewalk_status": "clear|blocked|unsafe|not_visible",
  "missing_barriers": [],
  "public_risk_level": "NONE|LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "one sentence"
}'''


def fallback(message: str = 'Local vision model unavailable') -> dict[str, Any]:
    return {
        'pedestrians_detected': {'count': 0, 'too_close_to_site': False},
        'pedestrian_risks': [],
        'vehicle_risks': [],
        'barrier_status': {},
        'sidewalk_status': 'not_visible',
        'missing_barriers': [],
        'public_risk_level': 'NONE',
        'summary': message,
    }


def run_public_safety_agent(image_base64: str | None, image_mime_type: str | None) -> dict[str, Any]:
    if not image_base64:
        return fallback('No image provided')
    try:
        return gemma.analyze_image(image_base64, image_mime_type or 'image/jpeg', PUBLIC_SAFETY_PROMPT)
    except Exception as exc:
        data = fallback('Public safety agent used fallback output')
        data['error'] = str(exc)
        return data
