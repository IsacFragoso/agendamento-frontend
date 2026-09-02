import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../core/http/http-error';
import { listAppointments, updateAppointmentStatus } from '../services/appointments.service';

export function useProviderAppointments({ token }) {
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
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar as solicitações recebidas.'));
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

  const changeAppointmentStatus = async (appointmentId, status) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      await updateAppointmentStatus(appointmentId, status, token);
      setFeedbackMessage('Status atualizado com sucesso.');
      await loadAppointments();
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar o status do agendamento.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    appointments,
    changeAppointmentStatus,
    errorMessage,
    feedbackMessage,
    isLoading,
    isSubmitting,
    loadAppointments,
  };
}
