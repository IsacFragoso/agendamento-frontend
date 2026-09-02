export class HttpError extends Error {
  constructor({ status, message, errors = null, payload = null }) {
    super(message || 'Ocorreu um erro inesperado.');
    this.name = 'HttpError';
    this.status = status;
    this.errors = errors;
    this.payload = payload;
  }
}

export const isHttpError = (error) => error instanceof HttpError;

export const getErrorMessage = (error, fallbackMessage = 'Ocorreu um erro inesperado.') => {
  if (isHttpError(error)) {
    return error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'A solicitação foi cancelada.';
    }

    return error.message || fallbackMessage;
  }

  return fallbackMessage;
};
