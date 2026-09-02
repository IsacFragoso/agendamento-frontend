import { requestHelper } from '../../../core/http/request-helper';

export const listProviderServices = (providerId) => requestHelper(`/servicos/prestador/${providerId}`);
export const listPublicServices = () => requestHelper('/servicos');
export const listCategories = () => requestHelper('/categorias');

export const createService = (payload, token) => requestHelper('/servicos', {
  method: 'POST',
  token,
  body: JSON.stringify(payload),
});

export const deleteService = (serviceId, token) => requestHelper(`/servicos/${serviceId}`, {
  method: 'DELETE',
  token,
});
