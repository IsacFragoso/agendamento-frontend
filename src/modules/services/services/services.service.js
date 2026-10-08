import { requestHelper } from '../../../core/http/request-helper';

export const listProviderServices = (providerId) => requestHelper(`/servicos/prestador/${providerId}`);
export const listPublicServices = () => requestHelper('/servicos');
export const listCategories = () => requestHelper('/categorias');
export const listProviders = () => requestHelper('/prestadores');

export const createService = (payload, token) => requestHelper('/servicos', {
  method: 'POST',
  token,
  body: JSON.stringify(payload),
});

export const updateService = (serviceId, payload, token) => requestHelper(`/servicos/${serviceId}`, {
  method: 'PATCH',
  token,
  body: JSON.stringify(payload),
});

export const deleteService = (serviceId, token) => requestHelper(`/servicos/${serviceId}`, {
  method: 'DELETE',
  token,
});
