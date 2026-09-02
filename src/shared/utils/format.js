export const WEEK_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const formatTime = (value) => {
  if (!value) {
    return '';
  }

  const textValue = value.toString();
  return textValue.includes('T') ? textValue.split('T')[1].slice(0, 5) : textValue.slice(0, 5);
};

export const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const normalized = value.includes('T') ? value.split('T')[0] : value;
  const [year, month, day] = normalized.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

export const formatCurrency = (value) => (
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
);

export const calculateAppointmentEnd = (date, time, durationInMinutes) => {
  const startDate = new Date(`${date}T${time}:00`);
  startDate.setMinutes(startDate.getMinutes() + Number(durationInMinutes || 60));
  return startDate.toISOString();
};

export const normalizeScheduleItems = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload?.dias_atendimento) {
    return [{
      dia: payload.dias_atendimento,
      hora_inicio: payload.horario_inicio,
      hora_fim: payload.horario_fim,
    }];
  }

  return [];
};
