import { requestHelper } from '../../../core/http/request-helper';

export const updateAccount = (userId, payload, token) => requestHelper(`/usuarios/${userId}`, {
  method: 'PATCH',
  token,
  body: JSON.stringify(payload),
});

export const uploadAccountPhoto = (userId, file, token) => {
  const body = new FormData();
  body.append('file', file);

  return requestHelper(`/usuarios/${userId}/foto-perfil`, {
    method: 'POST',
    token,
    body,
  });
};

export const deactivateAccount = (userId, token) => requestHelper(`/usuarios/${userId}`, {
  method: 'DELETE',
  token,
});

export const changeAccountPassword = (userId, payload, token) => requestHelper(`/usuarios/${userId}/senha`, {
  method: 'PATCH',
  token,
  body: JSON.stringify(payload),
});