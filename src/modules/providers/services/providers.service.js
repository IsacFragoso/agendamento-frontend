import { requestHelper } from '../../../core/http/request-helper';

export const listPublicProviders = () => requestHelper('/prestadores');
export const getPublicProvider = (providerId) => requestHelper(`/prestadores/${providerId}`);
export const listProviderSchedule = (providerId) => requestHelper(`/prestadores/${providerId}/horario`);
export const getProviderAvailability = (providerId, serviceId, date) => requestHelper(
	`/prestadores/${providerId}/horario/disponibilidade?servico_id=${serviceId}&data=${date}`,
);