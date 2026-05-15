import json
from typing import Any

from models.gemma_adapter import gemma


def fallback(perception: dict[str, Any], worker_safety: dict[str, Any], public_safety: dict[str, Any], weather_data: dict[str, Any] | None, message: str = 'Rule-based risk fallback used') -> dict[str, Any]:
    score = 20
    risks = []
    hazards = perception.get('hazards') or []
    violations = worker_safety.get('violations') or []
    public_risks = public_safety.get('pedestrian_risks') or []
    score += min(len(hazards) * 10, 30)
    score += min(len(violations) * 12, 30)
    score += min(len(public_risks) * 12, 25)
    if weather_data and (weather_data.get('wind_gusts_10m') or 0) >= 25:
        score += 10
        risks.append('High wind may increase lifting, fall, and debris risks')
    risks.extend(hazards[:2])
    risks.extend([item.get('issue', str(item)) if isinstance(item, dict) else str(item) for item in violations[:2]])
    risks.extend(public_risks[:2])
    score = min(score, 100)
    level = 'LOW' if score < 35 else 'MEDIUM' if score < 60 else 'HIGH' if score < 85 else 'CRITICAL'
    return {
        'overall_score': score,
        'risk_level': level,
        'risk_breakdown': {'worker_safety': score, 'public_safety': score, 'equipment': score, 'schedule': 20, 'weather': 20},
        'compound_risks': [],
        'top_3_risks': risks[:3] or ['No high-confidence risks detected by fallback rules'],
        'weather_impact': 'Weather included when available',
        'summary': message,
    }


def run_risk_agent(perception: dict[str, Any], worker_safety: dict[str, Any], public_safety: dict[str, Any], progress: dict[str, Any], weather_data: dict[str, Any] | None) -> dict[str, Any]:
    prompt = f'''You are the Site Risk Agent for ConstructGuard AI.
Synthesize these reports into a risk assessment.
Agent reports: {json.dumps({'perception': perception, 'workerSafety': worker_safety, 'publicSafety': public_safety, 'progress': progress, 'weatherData': weather_data})}
Respond only with valid JSON:
{{
  "overall_score": 0,
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "risk_breakdown": {{"worker_safety": 0, "public_safety": 0, "equipment": 0, "schedule": 0, "weather": 0}},
  "compound_risks": [],
  "top_3_risks": [],
  "weather_impact": "text",
  "summary": "one sentence"
}}'''
    try:
        return gemma.analyze_text(prompt)
    except Exception as exc:
        data = fallback(perception, worker_safety, public_safety, weather_data)
        data['error'] = str(exc)
        return data
