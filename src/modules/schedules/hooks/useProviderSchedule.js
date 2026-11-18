import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../core/http/http-error';
import { normalizeScheduleItems, WEEK_DAYS } from '../../../shared/utils/format';
import {
  getProviderSchedule,
  removeProviderScheduleInterval,
  saveProviderScheduleDay,
  updateProviderScheduleInterval,
} from '../services/schedules.service';

const INITIAL_FORM = {
  diaSelecionado: '1',
  horaInicio: '08:00',
  horaFim: '18:00',
};

export function useProviderSchedule({ providerId, token }) {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
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
    setErrorMessage('');
    setFeedbackMessage('');

    if (formValues.horaInicio >= formValues.horaFim) {
      setErrorMessage('O horário de encerramento deve ser posterior ao horário de início.');
      return false;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        dia_semana: Number(formValues.diaSelecionado),
        horario_inicio: formValues.horaInicio,
        horario_fim: formValues.horaFim,
      };

      if (editingScheduleId) {
        await updateProviderScheduleInterval(providerId, editingScheduleId, payload, token);
      } else {
        await saveProviderScheduleDay(providerId, payload, token);
      }

      setFeedbackMessage(editingScheduleId ? 'Disponibilidade atualizada.' : 'Disponibilidade adicionada.');
      setEditingScheduleId(null);
      setFormValues(INITIAL_FORM);
      await loadSchedule();
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível salvar a disponibilidade.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const editScheduleInterval = (schedule) => {
    setEditingScheduleId(schedule.id_horario);
    setFormValues({
      diaSelecionado: String(schedule.dia_semana),
      horaInicio: String(schedule.hora_inicio).slice(0, 5),
      horaFim: String(schedule.hora_fim).slice(0, 5),
    });
    setErrorMessage('');
    setFeedbackMessage('');
  };

  const cancelEditing = () => {
    setEditingScheduleId(null);
    setFormValues(INITIAL_FORM);
    setErrorMessage('');
    setFeedbackMessage('');
  };

  const removeScheduleInterval = async (scheduleId) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      await removeProviderScheduleInterval(providerId, scheduleId, token);
      setFeedbackMessage('Disponibilidade removida.');
      if (editingScheduleId === scheduleId) cancelEditing();
      await loadSchedule();
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível remover esta disponibilidade.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    days: WEEK_DAYS.map((label, index) => ({
      value: String((index + 1) % 7),
      label,
    })),
    cancelEditing,
    editScheduleInterval,
    editingScheduleId,
    errorMessage,
    feedbackMessage,
    formValues,
    isLoading,
    isSubmitting,
    loadSchedule,
    removeScheduleInterval,
    scheduleItems,
    submitSchedule,
    updateField,
  };
}
