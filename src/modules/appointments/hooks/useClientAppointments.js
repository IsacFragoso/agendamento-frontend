import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../core/http/http-error';
import { calculateAppointmentEnd } from '../../../shared/utils/format';
import { createAppointment, listAppointments } from '../services/appointments.service';

export function useClientAppointments({ clientId, token }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const loadAppointments = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload = await listAppointments(token);
      setAppointments(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setAppointments([]);
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar seus agendamentos.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAppointments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAppointments]);

  const requestAppointment = async ({ service, date, time }) => {
    if (!service) {
      setErrorMessage('Selecione um serviço antes de agendar.');
      return false;
    }

    if (!date || !time) {
      setErrorMessage('Informe a data e o horário desejados.');
      return false;
    }

    const normalizedClientId = Number.parseInt(clientId, 10);
    const normalizedServiceId = Number.parseInt(service.id || service.id_servico, 10);

    if (Number.isNaN(normalizedClientId) || Number.isNaN(normalizedServiceId)) {
      setErrorMessage('Não foi possível identificar cliente ou serviço para o agendamento.');
      return false;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      await createAppointment({
        id_cliente: normalizedClientId,
        id_servico: normalizedServiceId,
        data_hora_inicio: new Date(`${date}T${time}:00`).toISOString(),
        data_hora_fim: calculateAppointmentEnd(date, time, service.duracao_padrao),
      }, token);

      setFeedbackMessage('Solicitação de agendamento enviada com sucesso.');
      await loadAppointments();
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível solicitar o agendamento.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    appointments,
    errorMessage,
    feedbackMessage,
    isLoading,
    isSubmitting,
    loadAppointments,
    requestAppointment,
  };
}
