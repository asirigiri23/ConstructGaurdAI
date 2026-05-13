import { callGemmaText } from './gemmaClient.js';

export async function runActionAgent({ perception, workerSafety, publicSafety, progress, riskResult, weatherData, schedule }) {
  console.log('[ActionAgent] Generating action plan...');

  // Default: keep this project Gemma-centered for the hackathon.
  // If you want Claude later, you can replace this function with the old Anthropic call.
  const prompt = `You are the Action Agent for ConstructGuard AI — a construction site safety command center.
You generate SPECIFIC, ACTIONABLE steps for site supervisors.
Be precise: include distances, OSHA references if applicable, equipment names, and deadlines.
Always respond in valid JSON only.

Generate a prioritized action plan based on these agent reports:

Perception: ${JSON.stringify(perception)}
Progress: ${JSON.stringify(progress)}
Risk Score: ${riskResult?.overall_score}/100 (${riskResult?.risk_level})
Top Risks: ${JSON.stringify(riskResult?.top_3_risks)}
Worker Issues: ${JSON.stringify(workerSafety?.violations)}
Public Risks: ${JSON.stringify(publicSafety?.pedestrian_risks)}
Weather: ${JSON.stringify(weatherData)}
Schedule: ${JSON.stringify(schedule)}

Respond ONLY with valid JSON:
{
  "immediate_actions": [
    {
      "priority": 1,
      "action": "specific action to take RIGHT NOW",
      "who": "site supervisor|safety officer|foreman|all workers",
      "why": "which risk this addresses",
      "osha_reference": "29 CFR 1926.XXX if applicable"
    }
  ],
  "short_term_actions": [
    {
      "priority": 4,
      "action": "action for today or tomorrow",
      "deadline": "within 2 hours|today|tomorrow",
      "who": "who should do it"
    }
  ],
  "schedule_impacts": ["any schedule delays this causes"],
  "materials_needed": ["list materials/equipment to fix the issues"],
  "notify": ["who should be notified — safety officer, owner, city/public works, etc."],
  "estimated_fix_time": "how long to resolve all critical issues",
  "summary": "One sentence executive summary"
}`;

  const result = await callGemmaText(prompt);
  return JSON.parse(result);
}
