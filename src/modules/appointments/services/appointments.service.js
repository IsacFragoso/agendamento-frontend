import { requestHelper } from '../../../core/http/request-helper';

export const listAppointments = (token) => requestHelper('/agendamentos', { token });

export const updateAppointmentStatus = (appointmentId, status, token) => requestHelper(`/agendamentos/${appointmentId}/status`, {
  method: 'PATCH',
  token,
  body: JSON.stringify({ status: String(status || '').toUpperCase() }),
});

export const createAppointment = (payload, token) => requestHelper('/agendamentos', {
  method: 'POST',
  token,
  body: JSON.stringify(payload),
});
