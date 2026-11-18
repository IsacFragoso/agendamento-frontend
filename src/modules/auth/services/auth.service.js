import { requestHelper } from '../../../core/http/request-helper';

export const registerUser = (payload) => requestHelper('/usuarios', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const loginUser = (payload) => requestHelper('/auth/login', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const requestPasswordReset = (email) => requestHelper('/auth/recuperar-senha', {
  method: 'POST',
  body: JSON.stringify({ email }),
});

export const resetPassword = (payload) => requestHelper('/auth/redefinir-senha', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const verifyEmail = (token) => requestHelper('/auth/verificar-email', {
  method: 'POST',
  body: JSON.stringify({ token }),
});

export const requestEmailVerification = (email) => requestHelper('/auth/reenviar-verificacao', {
  method: 'POST',
  body: JSON.stringify({ email }),
});
