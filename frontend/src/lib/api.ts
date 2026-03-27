/// <reference types="vite/client" />
import axios from 'axios';

// En desarrollo usa el proxy de Vite ('/api').
// En producción: define VITE_API_URL en Vercel (sin / al final) y redeploy.
const rawBackend = (import.meta.env.VITE_API_URL as string | undefined) || '';
export const BACKEND_URL = rawBackend.replace(/\/+$/, '');

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
