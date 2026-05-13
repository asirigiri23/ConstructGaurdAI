// backend/agents/orchestrator.js
// ConstructGuard AI — Multi-Agent Orchestrator
// Runs all 6 agents in parallel, then synthesizes results

import { runPerceptionAgent } from './perceptionAgent.js';
import { runWorkerSafetyAgent } from './workerSafetyAgent.js';
import { runPublicSafetyAgent } from './publicSafetyAgent.js';
import { runProgressAgent } from './progressAgent.js';
import { runRiskAgent } from './riskAgent.js';
import { runActionAgent } from './actionAgent.js';

/**
 * Main orchestrator — runs all agents in parallel where possible,
 * then feeds their outputs into the Risk and Action agents.
 *
 * @param {Object} input
 * @param {string} input.imageBase64   - base64 encoded site image (optional)
 * @param {string} input.imageMimeType - e.g. "image/jpeg"
 * @param {string} input.dailyLog      - text from daily log PDF/CSV (optional)
 * @param {Object} input.weatherData   - from Open-Meteo API (optional)
 * @param {Object} input.schedule      - project schedule object (optional)
 * @param {string} input.siteId        - identifier for the site
 */
export async function runAllAgents(input) {
  const { imageBase64, imageMimeType, dailyLog, weatherData, schedule, siteId } = input;

  console.log(`[Orchestrator] Starting analysis for site: ${siteId}`);
  const startTime = Date.now();

  // PHASE 1 — Run the 4 perception/data agents in parallel
  // These don't depend on each other, so we run them simultaneously
  const [
    perceptionResult,
    workerResult,
    publicResult,
    progressResult,
  ] = await Promise.allSettled([
    runPerceptionAgent({ imageBase64, imageMimeType }),
    runWorkerSafetyAgent({ imageBase64, imageMimeType }),
    runPublicSafetyAgent({ imageBase64, imageMimeType }),
    runProgressAgent({ imageBase64, imageMimeType, dailyLog, schedule }),
  ]);

  // Extract values safely (agents might fail independently)
  const perception = perceptionResult.status === 'fulfilled'
    ? perceptionResult.value
    : { error: perceptionResult.reason?.message, detected_objects: [], summary: 'Agent failed' };

  const workerSafety = workerResult.status === 'fulfilled'
    ? workerResult.value
    : { error: workerResult.reason?.message, violations: [], summary: 'Agent failed' };

  const publicSafety = publicResult.status === 'fulfilled'
    ? publicResult.value
    : { error: publicResult.reason?.message, pedestrian_risks: [], summary: 'Agent failed' };

  const progress = progressResult.status === 'fulfilled'
    ? progressResult.value
    : { error: progressResult.reason?.message, stage: 'Unknown', summary: 'Agent failed' };

  console.log('[Orchestrator] Phase 1 complete — running Risk + Action agents');

  // PHASE 2 — Risk Agent aggregates all Phase 1 results + weather
  const riskResult = await runRiskAgent({
    perception,
    workerSafety,
    publicSafety,
    progress,
    weatherData,
  });

  // PHASE 3 — Action Agent uses everything to make a plan
  const actionResult = await runActionAgent({
    perception,
    workerSafety,
    publicSafety,
    progress,
    riskResult,
    weatherData,
    schedule,
  });

  const elapsed = Date.now() - startTime;
  console.log(`[Orchestrator] Full analysis complete in ${elapsed}ms`);

  return {
    siteId,
    timestamp: new Date().toISOString(),
    analysisTimeMs: elapsed,
    agents: {
      perception,
      worker_safety: workerSafety,
      public_safety: publicSafety,
      progress,
      risk: riskResult,
      actions: actionResult,
    },
  };
}
