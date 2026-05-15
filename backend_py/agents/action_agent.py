import json
from typing import Any

from models.gemma_adapter import gemma


def fallback(risk_result: dict[str, Any], message: str = 'Rule-based action fallback used') -> dict[str, Any]:
    level = risk_result.get('risk_level', 'UNKNOWN')
    top_risks = risk_result.get('top_3_risks') or []
    immediate = []
    if level in {'HIGH', 'CRITICAL'}:
        immediate.append({
            'priority': 1,
            'action': 'Pause affected work zone and have the site supervisor verify hazards before work resumes.',
            'who': 'site supervisor',
            'why': top_risks[0] if top_risks else 'Elevated site risk',
            'osha_reference': '29 CFR 1926',
        })
    else:
        immediate.append({
            'priority': 1,
            'action': 'Perform a visual safety walk and confirm PPE, barriers, and access routes are acceptable.',
            'who': 'safety officer',
            'why': 'Routine risk control',
            'osha_reference': '29 CFR 1926',
        })
    return {
        'immediate_actions': immediate,
        'short_term_actions': [{'priority': 4, 'action': 'Log findings and re-run analysis after corrective actions.', 'deadline': 'today', 'who': 'foreman'}],
        'schedule_impacts': [],
        'materials_needed': ['barriers/cones/signage as required after human inspection'],
        'notify': ['site supervisor'],
        'estimated_fix_time': '15-60 minutes depending on confirmed hazards',
        'summary': message,
    }


def run_action_agent(perception: dict[str, Any], worker_safety: dict[str, Any], public_safety: dict[str, Any], progress: dict[str, Any], risk_result: dict[str, Any], weather_data: dict[str, Any] | None, schedule: dict[str, Any] | None) -> dict[str, Any]:
    prompt = f'''You are the Action Agent for ConstructGuard AI, a construction site safety command center.
Generate specific actions for human site supervisors.
Inputs: {json.dumps({'perception': perception, 'workerSafety': worker_safety, 'publicSafety': public_safety, 'progress': progress, 'risk': risk_result, 'weatherData': weather_data, 'schedule': schedule})}
Respond only with valid JSON:
{{
  "immediate_actions": [],
  "short_term_actions": [],
  "schedule_impacts": [],
  "materials_needed": [],
  "notify": [],
  "estimated_fix_time": "text",
  "summary": "one sentence"
}}'''
    try:
        return gemma.analyze_text(prompt)
    except Exception as exc:
        data = fallback(risk_result)
        data['error'] = str(exc)
        return data
