// Use the deployed backend in production; keep Vite's local proxy for development.
const configuredApi = import.meta.env.VITE_API_URL?.trim();
const API = (configuredApi && (configuredApi.startsWith('http://') || configuredApi.startsWith('https://'))) ? configuredApi : (import.meta.env.PROD ? 'https://accounts-dashboard-ltwo.vercel.app' : '/api');

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
