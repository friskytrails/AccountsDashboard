// The Express routes are mounted below /api. Accept either a full backend URL
// or a path, but always normalize the base so requests reach those routes.
const configuredApi = import.meta.env.VITE_API_URL?.trim();
const normalizeApiBase = (value) => {
  const base = value.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
};

const API = configuredApi
  ? normalizeApiBase(configuredApi)
  : normalizeApiBase(import.meta.env.PROD ? 'https://accounts-dashboard-ltwo.vercel.app' : '/api');

export function getToken() {
  return localStorage.getItem('accounts_token') || '';
}

export function getAuthHeaders() {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch(path, options = {}) {
  const url = `${API}${path}`;
  const res = await fetch(url, {
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    },
    ...options
  });

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`Invalid JSON response: ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }

  return data;
}
