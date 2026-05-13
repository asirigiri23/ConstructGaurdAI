// backend/agents/perceptionAgent.js
// Agent 1 — Site Perception Agent
// Uses Gemma 4's vision capability to detect all objects in the scene
//
// HOW TO SWITCH BETWEEN GEMMA 4 PROVIDERS:
//   Option A: Google AI Studio (cloud)  → set GEMMA_PROVIDER=google
//   Option B: Ollama (local on your PC) → set GEMMA_PROVIDER=ollama
//   Option C: Groq (fast cloud)         → set GEMMA_PROVIDER=groq

const PROVIDER = process.env.GEMMA_PROVIDER || 'google';
const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const PERCEPTION_PROMPT = `You are the Site Perception Agent for ConstructGuard AI.

Analyze this construction site image and identify EVERY object, person, and safety element visible.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "detected_objects": ["list every item you see"],
  "workers": { "count": 0, "positions": ["description of where each is"] },
  "equipment": ["list all machinery/vehicles"],
  "hazards": ["open trenches", "debris", "unstable piles", "exposed wiring", etc.],
  "safety_elements_present": ["cones", "barriers", "signs", "hard hats", etc.],
  "safety_elements_missing": ["what SHOULD be here but isn't"],
  "zones": {
    "danger_zones": ["describe locations"],
    "work_zones": ["describe locations"],
    "public_access": ["describe locations"]
  },
  "confidence": 0.0-1.0,
  "summary": "One sentence describing the overall site state"
}`;

export async function runPerceptionAgent({ imageBase64, imageMimeType }) {
  console.log('[PerceptionAgent] Starting object detection...');

  if (!imageBase64) {
    return {
      detected_objects: [],
      workers: { count: 0, positions: [] },
      equipment: [],
      hazards: [],
      safety_elements_present: [],
      safety_elements_missing: [],
      zones: {},
      confidence: 0,
      summary: 'No image provided for analysis',
    };
  }

  try {
    let responseText;

    if (PROVIDER === 'google') {
      responseText = await callGemma4Google(imageBase64, imageMimeType, PERCEPTION_PROMPT);
    } else if (PROVIDER === 'ollama') {
      responseText = await callGemma4Ollama(imageBase64, PERCEPTION_PROMPT);
    } else if (PROVIDER === 'groq') {
      responseText = await callGemma4Groq(imageBase64, imageMimeType, PERCEPTION_PROMPT);
    } else {
      throw new Error(`Unknown provider: ${PROVIDER}`);
    }

    const cleaned = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[PerceptionAgent] Error:', err.message);
    throw err;
  }
}

// ──────────────────────────────────────────
// PROVIDER IMPLEMENTATIONS
// ──────────────────────────────────────────

// Option A: Google AI Studio (Gemma 4 via Gemini API)
// Sign up free at: https://aistudio.google.com
// Get key at:      https://aistudio.google.com/app/apikey
async function callGemma4Google(imageBase64, mimeType, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${GOOGLE_API_KEY}`;
  // Note: As of 2026, use "gemma-3-27b-it" or "gemma-4" when available
  // Check current model names at: https://ai.google.dev/models

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature: 0.1,   // Low temp = more deterministic/consistent
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) throw new Error(`Google AI error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

// Option B: Ollama (run Gemma locally — FREE, private, no API key)
// Install: https://ollama.com
// Then run: ollama pull gemma3:27b
// Then run: ollama serve
async function callGemma4Ollama(imageBase64, prompt) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma3:27b',  // or 'gemma3:12b' for faster/cheaper
      prompt,
      images: [imageBase64],  // Ollama accepts raw base64
      stream: false,
      options: { temperature: 0.1, num_predict: 1024 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response;
}

// Option C: Groq (very fast cloud inference, has Gemma)
// Sign up: https://console.groq.com
// Free tier available
async function callGemma4Groq(imageBase64, mimeType, prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gemma2-9b-it',  // Groq's fastest Gemma — check groq.com for gemma4 when available
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: prompt },
        ],
      }],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}
