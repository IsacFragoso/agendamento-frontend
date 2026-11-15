import { requestHelper } from '../../../core/http/request-helper';

export const listAppointments = (token) => requestHelper('/agendamentos', { token });

export const updateAppointmentStatus = (appointmentId, status, token, motivoCancelamento) => requestHelper(`/agendamentos/${appointmentId}/status`, {
  method: 'PATCH',
  token,
  body: JSON.stringify({
    status: String(status || '').toUpperCase(),
    ...(motivoCancelamento ? { motivo_cancelamento: motivoCancelamento } : {}),
  }),
});

export const createAppointment = (payload, token) => requestHelper('/agendamentos', {
  method: 'POST',
  token,
  body: JSON.stringify(payload),
});

export const createAppointmentReview = (appointmentId, payload, token) => requestHelper(`/agendamentos/${appointmentId}/avaliacao`, {
  method: 'POST',
  token,
  body: JSON.stringify(payload),
});

export const listAppointmentReviews = (appointmentId, token) => requestHelper(`/agendamentos/${appointmentId}/avaliacoes`, { token });
