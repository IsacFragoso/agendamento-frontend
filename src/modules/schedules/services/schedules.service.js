import { requestHelper } from '../../../core/http/request-helper';

export const getProviderSchedule = (providerId) => requestHelper(`/prestadores/${providerId}/horario`);

export const saveProviderScheduleDay = (providerId, payload, token) => requestHelper(`/prestadores/${providerId}/horario`, {
  method: 'PUT',
  token,
  body: JSON.stringify(payload),
});

export const updateProviderScheduleInterval = (providerId, scheduleId, payload, token) => requestHelper(`/prestadores/${providerId}/horario/${scheduleId}`, {
  method: 'PATCH',
  token,
  body: JSON.stringify(payload),
});

export const removeProviderScheduleInterval = (providerId, scheduleId, token) => requestHelper(`/prestadores/${providerId}/horario/${scheduleId}`, {
  method: 'DELETE',
  token,
});

export const removeProviderScheduleDay = (providerId, day, token) => requestHelper(`/prestadores/${providerId}/horario`, {
  method: 'DELETE',
  token,
  body: JSON.stringify({ dias_atendimento: day }),
});
