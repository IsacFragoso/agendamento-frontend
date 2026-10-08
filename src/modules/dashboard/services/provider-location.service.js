import { requestHelper } from '../../../core/http/request-helper';

export const getProviderAccount = (providerId, token) => requestHelper(`/usuarios/${providerId}`, { token });

export const saveProviderLocation = (providerId, coordinates, token) => requestHelper(
  `/usuarios/${providerId}/perfil-prestador`,
  {
    method: 'PUT',
    token,
    body: JSON.stringify(coordinates),
  },
);

export const uploadProviderBanner = (providerId, file, token) => {
  const body = new FormData();
  body.append('file', file);

  return requestHelper(`/usuarios/${providerId}/banner`, {
    method: 'POST',
    token,
    body,
  });
};