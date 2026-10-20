import { requestHelper } from '../../core/http/request-helper';

export const updateAccount = (userId, payload, token) => requestHelper(`/usuarios/${userId}`, {
  method: 'PATCH',
  token,
  body: JSON.stringify(payload),
});

export const updatePassword = (userId, payload, token) => requestHelper(`/usuarios/${userId}/senha`, {
  method: 'PATCH',
  token,
  body: JSON.stringify(payload),
});

export const deleteAccount = (userId, token) => requestHelper(`/usuarios/${userId}`, {
  method: 'DELETE',
  token,
});