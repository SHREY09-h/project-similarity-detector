const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function errorMessage(detail) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(item => item.msg).filter(Boolean).join(' ');
  return 'The request could not be completed. Please try again.';
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(BASE + path, options);
  } catch {
    throw new Error('Cannot connect to the analysis service. Make sure the backend is running.');
  }

  if (!response.ok) {
    let data = {};
    try { data = await response.json(); } catch { /* The server did not return JSON. */ }
    throw new Error(errorMessage(data.detail));
  }

  return response.status === 204 ? null : response.json();
}

export const api = {
  projects: (query = '') => request('/projects' + query),
  project: id => request(`/projects/${id}`),
  analysis: id => request(`/analysis/${id}`),
  analyze: data => request('/analysis', { method: 'POST', body: data }),
};
