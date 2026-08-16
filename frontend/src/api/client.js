const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[AudienceOS API] ${endpoint} failed, falling back:`, err);
    return null;
  }
}

export const api = {
  getDashboard: () => fetchApi('/dashboard'),
  getAudience: () => fetchApi('/audience'),
  getOpportunities: () => fetchApi('/opportunities'),
  getOpportunityDetail: (id) => fetchApi(`/opportunities/${id}`),
  generateContentPackage: (id) => fetchApi(`/opportunities/${id}/generate`, { method: 'POST' }),
  getContentStudio: () => fetchApi('/content-studio'),
  saveContentStudio: (data) => fetchApi('/content-studio/save', { method: 'POST', body: JSON.stringify(data) }),
  getCalendar: () => fetchApi('/calendar'),
  scheduleYouTubeVideo: (data) => fetchApi('/calendar', { method: 'POST', body: JSON.stringify(data) }),
  autoScheduleYouTubeVideo: (data) => fetchApi('/calendar/auto-schedule', { method: 'POST', body: JSON.stringify(data) }),
  getAnalytics: () => fetchApi('/analytics'),
  getSettings: () => fetchApi('/settings'),
  saveSettings: (data) => fetchApi('/settings', { method: 'POST', body: JSON.stringify(data) }),
  runAnalysis: (rangeType = 'Last 30 days', channelHandle = '') => fetchApi(`/analyze?range_type=${encodeURIComponent(rangeType)}${channelHandle ? `&channel_handle=${encodeURIComponent(channelHandle)}` : ''}`, { method: 'POST' }),
};
