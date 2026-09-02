const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

export async function apiClient(path, options = {}) {
  const { token, headers = {}, body, ...rest } = options;
  const requestHeaders = new Headers(headers);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body && !isFormData && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body,
  });
}
