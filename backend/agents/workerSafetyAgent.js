// backend/agents/workerSafetyAgent.js
// Agent 2 — Worker Safety Agent
// Checks PPE, risky positions, fall hazards, equipment proximity

import { callGemmaVision } from './gemmaClient.js';

const WORKER_SAFETY_PROMPT = `You are the Worker Safety Agent for ConstructGuard AI.

You specialize in OSHA construction safety standards (29 CFR 1926).

Look at this construction site image and identify ALL worker safety issues.

Respond ONLY with valid JSON:
{
  "violations": [
    {
      "worker_id": "W-01",
      "issue": "No hard hat",
      "osha_standard": "29 CFR 1926.100",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "location": "description of where in the frame"
    }
  ],
  "ppe_compliance": {
    "hard_hat": "compliant|non-compliant|partial|unknown",
    "safety_vest": "compliant|non-compliant|partial|unknown",
    "safety_boots": "compliant|non-compliant|partial|unknown",
    "gloves": "compliant|non-compliant|partial|unknown",
    "eye_protection": "compliant|non-compliant|partial|unknown"
  },
  "fall_hazards": ["list any fall hazard situations"],
  "equipment_proximity_risks": ["list workers too close to moving machinery"],
  "blocked_exits": ["list any blocked emergency exits"],
  "overall_compliance_score": 0-100,
  "summary": "One sentence summary"
}`;

export async function runWorkerSafetyAgent({ imageBase64, imageMimeType }) {
  console.log('[WorkerSafetyAgent] Checking PPE and hazards...');
  if (!imageBase64) return { violations: [], ppe_compliance: {}, fall_hazards: [], overall_compliance_score: 100, summary: 'No image provided' };
  return callGemmaVision(imageBase64, imageMimeType, WORKER_SAFETY_PROMPT);
}
