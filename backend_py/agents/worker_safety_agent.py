from typing import Any

from models.gemma_adapter import gemma

WORKER_SAFETY_PROMPT = '''You are the Worker Safety Agent for ConstructGuard AI.
You specialize in OSHA construction safety standards, especially 29 CFR 1926.
Look at this construction site image and identify worker safety issues.
Respond only with valid JSON:
{
  "violations": [],
  "ppe_compliance": {
    "hard_hat": "compliant|non-compliant|partial|unknown",
    "safety_vest": "compliant|non-compliant|partial|unknown",
    "safety_boots": "compliant|non-compliant|partial|unknown",
    "gloves": "compliant|non-compliant|partial|unknown",
    "eye_protection": "compliant|non-compliant|partial|unknown"
  },
  "fall_hazards": [],
  "equipment_proximity_risks": [],
  "blocked_exits": [],
  "overall_compliance_score": 0,
  "summary": "one sentence"
}'''


def fallback(message: str = 'Local vision model unavailable') -> dict[str, Any]:
    return {
        'violations': [],
        'ppe_compliance': {'hard_hat': 'unknown', 'safety_vest': 'unknown', 'safety_boots': 'unknown', 'gloves': 'unknown', 'eye_protection': 'unknown'},
        'fall_hazards': [],
        'equipment_proximity_risks': [],
        'blocked_exits': [],
        'overall_compliance_score': 0,
        'summary': message,
    }


def run_worker_safety_agent(image_base64: str | None, image_mime_type: str | None) -> dict[str, Any]:
    if not image_base64:
        return fallback('No image provided')
    try:
        return gemma.analyze_image(image_base64, image_mime_type or 'image/jpeg', WORKER_SAFETY_PROMPT)
    except Exception as exc:
        data = fallback('Worker safety agent used fallback output')
        data['error'] = str(exc)
        return data
