# Gemma 4 Setup Guide for ConstructGuard AI

## What is Gemma 4?

Gemma 4 is Google's open-weight vision-language model.
It can SEE images and describe what's in them — perfect for construction site analysis.

For ConstructGuard, Gemma 4 powers:
- Site Perception Agent (object detection)
- Worker Safety Agent (PPE checking)  
- Public Safety Agent (pedestrian risk)
- Progress Agent (stage classification)

Claude handles the Risk + Action agents (better reasoning).

---

## Option A: Google AI Studio (START HERE)

Easiest way to get running TODAY. Free tier = 60 requests/minute.

### Steps:
1. Go to https://aistudio.google.com
2. Sign in with Google account
3. Click "Get API Key" → "Create API Key"
4. Copy the key (starts with AIzaSy...)
5. In your .env file:
   ```
   GEMMA_PROVIDER=google
   GOOGLE_AI_API_KEY=AIzaSy-your-key-here
   ```
6. The model name to use:
   ```
   gemma-3-27b-it     ← best quality, use for production
   gemma-3-12b-it     ← faster, cheaper, still good
   gemma-3-4b-it      ← fastest, for testing only
   ```
   Note: When Gemma 4 releases officially, update to:
   ```
   gemma-4-27b-it     ← or whatever Google names it
   ```
   Always check: https://ai.google.dev/models

### Cost estimate:
- Free tier: 1,500 requests/day (plenty for a demo/MVP)
- Paid: ~$0.0035 per image analysis at 27B model

---

## Option B: Ollama (Best for Production — FREE, Private)

Run Gemma completely on your own computer or server.
No API keys. No usage limits. No data leaving your network.

### Requirements:
- A computer with a decent GPU (NVIDIA recommended)
- 8GB VRAM minimum for 12B model
- 24GB VRAM for 27B model
- OR use CPU-only (slower but works)

### Steps:
1. Install Ollama:
   - Mac: `brew install ollama`
   - Linux: `curl -fsSL https://ollama.com/install.sh | sh`
   - Windows: Download from https://ollama.com

2. Pull Gemma model:
   ```bash
   ollama pull gemma3:27b   # best quality (17GB download)
   # OR
   ollama pull gemma3:12b   # good balance (7GB download)
   # OR
   ollama pull gemma3:4b    # fastest (3GB download)
   ```

3. Start the server:
   ```bash
   ollama serve
   # Runs on http://localhost:11434 by default
   ```

4. In your .env:
   ```
   GEMMA_PROVIDER=ollama
   OLLAMA_URL=http://localhost:11434
   ```

5. Test it works:
   ```bash
   curl http://localhost:11434/api/generate -d '{
     "model": "gemma3:12b",
     "prompt": "Say hello",
     "stream": false
   }'
   ```

### For cloud deployment with Ollama:
- Rent a GPU server on RunPod.io or Lambda Labs
- Install Ollama there, expose port 11434
- Set OLLAMA_URL=http://your-server-ip:11434

---

## Option C: Groq (Fastest Cloud — Free Tier)

Groq runs Gemma at insane speed (~500 tokens/second).
Great for live video analysis where speed matters.

### Steps:
1. Sign up at https://console.groq.com
2. Create API key
3. In your .env:
   ```
   GEMMA_PROVIDER=groq
   GROQ_API_KEY=gsk_your-key-here
   ```
4. Available Gemma models on Groq:
   - `gemma2-9b-it` — fast and free
   - Check https://console.groq.com/docs/models for Gemma 4 when available

---

## Testing Your Gemma Setup

Once you have your .env configured, test with:

```bash
cd backend
npm install
node -e "
import('./agents/perceptionAgent.js').then(({runPerceptionAgent}) => {
  // Test with no image (should return empty result, not crash)
  runPerceptionAgent({}).then(r => {
    console.log('Perception agent working:', JSON.stringify(r, null, 2));
  });
});
"
```

---

## Architecture: Why Gemma + Claude Together?

```
Image Input
    ↓
┌─────────────────────────────────────┐
│  GEMMA 4 (Vision Specialists)       │
│  - Perception Agent  (sees objects) │
│  - Worker Safety     (sees PPE)     │
│  - Public Safety     (sees people)  │
│  - Progress Agent    (sees stage)   │
└────────────────────┬────────────────┘
                     ↓ (structured JSON)
┌─────────────────────────────────────┐
│  CLAUDE SONNET (Reasoning Layer)    │
│  - Risk Agent    (synthesizes)      │
│  - Action Agent  (plans response)   │
└─────────────────────────────────────┘
                     ↓
              Final Report + Actions
```

Gemma 4 is good at: "What do I see in this image?"
Claude is good at: "Given all these findings, what should we DO?"

This combo is more accurate and cost-effective than using one model for everything.

---

## Datasets for Training / Fine-Tuning (Optional)

If you want to fine-tune Gemma specifically for construction:

| Dataset | Where to Find | What It Has |
|---------|--------------|-------------|
| Construction Site Safety | Roboflow Universe | 8K+ PPE labeled images |
| OSHA violation images | Kaggle | Safety violation photos |
| Hard Hat Detection | Roboflow | Helmet/no-helmet labels |
| Construction Progress | GitHub: progress-net | Stage classification |
| MSCOCO subset | cocodataset.org | General object detection |

Fine-tuning guide: https://ai.google.dev/gemma/docs/fine-tuning
You don't NEED to fine-tune to get started — the base model works well.
