/// <reference types="vite/client" />
import axios from 'axios';

// En desarrollo usa el proxy de Vite ('/api').
// En producción: VITE_API_URL en Vercel debe ser URL absoluta con https:// (ej. https://xxx.up.railway.app).
function normalizeBackendUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

const rawBackend = (import.meta.env.VITE_API_URL as string | undefined) || '';
export const BACKEND_URL = normalizeBackendUrl(rawBackend);

if (import.meta.env.PROD && !BACKEND_URL) {
  console.error(
    '[SST] Falta VITE_API_URL en el build de Vercel. Añádela en Settings → Environment Variables y vuelve a desplegar.'
  );
}

const api = axios.create({
  baseURL: BACKEND_URL ? `${BACKEND_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
