// frontend/src/agents/agentClient.js
// Calls your backend from the React frontend

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Upload a site image and run all 6 agents
 * @param {File} imageFile - the image file from file input
 * @param {Object} metadata - { siteId, dailyLog, schedule }
 * @returns {Promise<Object>} - full agent report
 */
export async function analyzeImage(imageFile, metadata = {}) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('siteId', metadata.siteId || 'site-a');
  if (metadata.dailyLog) formData.append('dailyLog', metadata.dailyLog);
  if (metadata.schedule) formData.append('schedule', JSON.stringify(metadata.schedule));

  // Also fetch weather and include it
  try {
    const wx = await fetch(`${BACKEND_URL}/api/weather?lat=41.53&lon=-87.25`);
    const wxData = await wx.json();
    if (wxData.success) formData.append('weatherData', JSON.stringify(wxData.data));
  } catch {}

  const res = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

/**
 * Fetch current weather for the site location
 */
export async function fetchSiteWeather(lat = 41.53, lon = -87.25) {
  const res = await fetch(`${BACKEND_URL}/api/weather?lat=${lat}&lon=${lon}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}
