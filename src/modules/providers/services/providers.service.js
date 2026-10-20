import { requestHelper } from '../../../core/http/request-helper';

export const listPublicProviders = ({ latitude, longitude, radiusKm } = {}) => {
  const params = new URLSearchParams();
  if (latitude !== undefined && longitude !== undefined) {
    params.set('latitude', latitude);
    params.set('longitude', longitude);
    if (radiusKm) params.set('raio_km', radiusKm);
  }
  const query = params.toString();
  return requestHelper(query ? `/prestadores?${query}` : '/prestadores');
};
export const getPublicProvider = (providerId) => requestHelper(`/prestadores/${providerId}`);
export const listProviderSchedule = (providerId) => requestHelper(`/prestadores/${providerId}/horario`);
export const getProviderContacts = (providerId) => requestHelper(`/prestadores/${providerId}/contatos`);
export const getProviderAvailability = (providerId, serviceId, date) => requestHelper(
	`/prestadores/${providerId}/horario/disponibilidade?servico_id=${serviceId}&data=${date}`,
);