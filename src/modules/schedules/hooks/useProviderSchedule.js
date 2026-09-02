import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../core/http/http-error';
import { normalizeScheduleItems, WEEK_DAYS } from '../../../shared/utils/format';
import { getProviderSchedule, removeProviderScheduleDay, saveProviderScheduleDay } from '../services/schedules.service';

const INITIAL_FORM = {
  diaSelecionado: 'Segunda',
  horaInicio: '08:00',
  horaFim: '18:00',
};

export function useProviderSchedule({ providerId, token }) {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const loadSchedule = useCallback(async () => {
    if (!providerId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload = await getProviderSchedule(providerId);
      setScheduleItems(normalizeScheduleItems(payload));
    } catch (error) {
      setScheduleItems([]);
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar os horários do prestador.'));
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSchedule();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadSchedule]);

  const updateField = (fieldName, value) => {
    setFormValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
  };

  const submitSchedule = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      await saveProviderScheduleDay(providerId, {
        dias_atendimento: formValues.diaSelecionado,
        horario_inicio: formValues.horaInicio,
        horario_fim: formValues.horaFim,
      }, token);

      setFeedbackMessage('Horário salvo com sucesso.');
      await loadSchedule();
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível salvar o horário.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeScheduleDay = async (day) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      await removeProviderScheduleDay(providerId, day, token);
      setFeedbackMessage('Dia removido com sucesso.');
      await loadSchedule();
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível remover o dia da agenda.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    days: WEEK_DAYS,
    errorMessage,
    feedbackMessage,
    formValues,
    isLoading,
    isSubmitting,
    loadSchedule,
    removeScheduleDay,
    scheduleItems,
    submitSchedule,
    updateField,
  };
}
