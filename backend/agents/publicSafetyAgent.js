import { callGemmaVision } from './gemmaClient.js';

const PUBLIC_SAFETY_PROMPT = `You are the Public Safety Agent for ConstructGuard AI.

Analyze this construction site image for risks to the PUBLIC — pedestrians, cyclists, drivers.

Respond ONLY with valid JSON:
{
  "pedestrians_detected": { "count": 0, "too_close_to_site": true|false },
  "pedestrian_risks": ["list each risk situation"],
  "vehicle_risks": ["list risks to passing cars/cyclists"],
  "barrier_status": {
    "hoarding_complete": true|false,
    "cones_adequate": true|false,
    "signage_adequate": true|false,
    "lighting_adequate": true|false
  },
  "sidewalk_status": "clear|blocked|unsafe|not_visible",
  "missing_barriers": ["describe what's missing and where"],
  "public_risk_level": "NONE|LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "One sentence"
}`;

export async function runPublicSafetyAgent({ imageBase64, imageMimeType }) {
  console.log('[PublicSafetyAgent] Checking pedestrian and public risks...');
  if (!imageBase64) {
    return {
      pedestrians_detected: { count: 0 },
      pedestrian_risks: [],
      vehicle_risks: [],
      barrier_status: {},
      sidewalk_status: 'not_visible',
      missing_barriers: [],
      public_risk_level: 'NONE',
      summary: 'No image provided',
    };
  }
  return callGemmaVision(imageBase64, imageMimeType, PUBLIC_SAFETY_PROMPT);
}
