import { callGemmaText } from './gemmaClient.js';

export async function runRiskAgent({ perception, workerSafety, publicSafety, progress, weatherData }) {
  console.log('[RiskAgent] Computing compound risk score...');

  const prompt = `You are the Site Risk Agent for ConstructGuard AI.

Synthesize these agent reports and weather into a comprehensive risk assessment.

AGENT REPORTS:
Perception Agent: ${JSON.stringify(perception)}
Worker Safety Agent: ${JSON.stringify(workerSafety)}
Public Safety Agent: ${JSON.stringify(publicSafety)}
Progress Agent: ${JSON.stringify(progress)}
Weather Data: ${JSON.stringify(weatherData)}

Consider compound risks — where multiple issues combine to be worse than either alone.
Example: open trench + pedestrian nearby + missing barrier = compound critical risk.

Respond ONLY with valid JSON:
{
  "overall_score": 0-100,
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "risk_breakdown": {
    "worker_safety": 0-100,
    "public_safety": 0-100,
    "equipment": 0-100,
    "schedule": 0-100,
    "weather": 0-100
  },
  "compound_risks": [
    {
      "description": "Open trench + pedestrian + no barrier",
      "severity": "CRITICAL",
      "contributing_factors": ["factor 1", "factor 2"]
    }
  ],
  "top_3_risks": ["rank the 3 most dangerous issues"],
  "weather_impact": "how weather is making things worse or better",
  "summary": "One sentence explaining the overall risk situation"
}`;

  const result = await callGemmaText(prompt);
  return JSON.parse(result);
}
