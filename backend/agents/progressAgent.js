import { callGemmaVision, callGemmaText } from './gemmaClient.js';

const PROGRESS_PROMPT = (dailyLog, schedule) => `You are the Construction Progress Agent for ConstructGuard AI.

Daily log excerpt: ${dailyLog || 'Not provided'}
Project schedule: ${schedule ? JSON.stringify(schedule) : 'Not provided'}

Analyze the image and classify the construction stage.
Stages in order: Demolition → Site Prep → Foundation → Framing → Electrical/Plumbing → Drywall → Flooring → Finishing → Handover

Respond ONLY with valid JSON:
{
  "current_stage": "stage name",
  "stage_number": 1-9,
  "estimated_completion_percent": 0-100,
  "visual_evidence": ["what in the image tells you this stage"],
  "completed_stages": ["list of completed stages"],
  "upcoming_milestone": "next major milestone",
  "schedule_status": "ahead|on_track|behind",
  "days_behind_or_ahead": 0,
  "summary": "One sentence"
}`;

export async function runProgressAgent({ imageBase64, imageMimeType, dailyLog, schedule }) {
  console.log('[ProgressAgent] Classifying construction stage...');
  const prompt = PROGRESS_PROMPT(dailyLog, schedule);
  if (imageBase64) return callGemmaVision(imageBase64, imageMimeType, prompt);
  const result = await callGemmaText(prompt);
  return JSON.parse(result);
}
