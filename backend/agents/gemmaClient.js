// backend/agents/gemmaClient.js
// Shared Gemma 4 vision call — used by all agents
// Configure which provider to use via .env

const PROVIDER = process.env.GEMMA_PROVIDER || 'google';

export async function callGemmaVision(imageBase64, mimeType, prompt) {
  let text;
  if (PROVIDER === 'ollama') {
    const res = await fetch(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemma3:27b', prompt, images: [imageBase64], stream: false, options: { temperature: 0.1 } }),
    });
    const d = await res.json();
    text = d.response;
  } else if (PROVIDER === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'gemma2-9b-it', messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }, { type: 'text', text: prompt }] }], temperature: 0.1, max_tokens: 1024 }),
    });
    const d = await res.json();
    text = d.choices[0].message.content;
  } else {
    // Default: Google AI Studio
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: mimeType, data: imageBase64 } }, { text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 1024 } }),
    });
    const d = await res.json();
    text = d.candidates[0].content.parts[0].text;
  }
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// Text-only call (for agents that don't need vision)
export async function callGemmaText(prompt) {
  if (PROVIDER === 'ollama') {
    const res = await fetch(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemma3:27b', prompt, stream: false, options: { temperature: 0.2 } }),
    });
    const d = await res.json();
    return d.response.replace(/```json|```/g, '').trim();
  } else {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 1024 } }),
    });
    const d = await res.json();
    return d.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
  }
}
