import { apiClient } from './api-client';
import { HttpError } from './http-error';

const NO_CONTENT_STATUS = new Set([204, 205]);

const extractMessage = (payload) => {
  if (!payload) {
    return 'Não foi possível concluir a operação.';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  return payload.mensagem || payload.message || payload.erro || 'Não foi possível concluir a operação.';
};

const parseResponseBody = async (response) => {
  if (NO_CONTENT_STATUS.has(response.status)) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? text : null;
};

export async function requestHelper(path, options = {}) {
  const response = await apiClient(path, options);
  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new HttpError({
      status: response.status,
      message: extractMessage(payload),
      errors: payload?.errors || null,
      payload,
    });
  }

  return payload ?? {};
}
