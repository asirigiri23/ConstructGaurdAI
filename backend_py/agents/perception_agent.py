from typing import Any

from models.gemma_adapter import gemma

PERCEPTION_PROMPT = '''You are the Site Perception Agent for ConstructGuard AI.
Analyze this construction site image and identify every object, person, and safety element visible.
Respond only with valid JSON:
{
  "detected_objects": [],
  "workers": { "count": 0, "positions": [] },
  "equipment": [],
  "hazards": [],
  "safety_elements_present": [],
  "safety_elements_missing": [],
  "zones": { "danger_zones": [], "work_zones": [], "public_access": [] },
  "confidence": 0.0,
  "summary": "one sentence"
}'''


def fallback(message: str = 'Local vision model unavailable') -> dict[str, Any]:
    return {
        'detected_objects': [],
        'workers': {'count': 0, 'positions': []},
        'equipment': [],
        'hazards': [],
        'safety_elements_present': [],
        'safety_elements_missing': [],
        'zones': {'danger_zones': [], 'work_zones': [], 'public_access': []},
        'confidence': 0,
        'summary': message,
    }


def run_perception_agent(image_base64: str | None, image_mime_type: str | None) -> dict[str, Any]:
    if not image_base64:
        return fallback('No image provided for analysis')
    try:
        return gemma.analyze_image(image_base64, image_mime_type or 'image/jpeg', PERCEPTION_PROMPT)
    except Exception as exc:
        data = fallback('Perception agent used fallback output')
        data['error'] = str(exc)
        return data
