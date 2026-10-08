export const WEEK_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const APPOINTMENT_TIME_ZONE = 'America/Sao_Paulo';
const appointmentDateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: APPOINTMENT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const dateTimeInAppointmentTimeZone = (date, time) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute);
  let resultUtc = targetUtc;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      appointmentDateTimeFormatter
        .formatToParts(new Date(resultUtc))
        .filter(({ type }) => type !== 'literal')
        .map(({ type, value }) => [type, Number(value)]),
    );
    const representedUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    const adjustment = targetUtc - representedUtc;

    resultUtc += adjustment;
    if (adjustment === 0) break;
  }

  return new Date(resultUtc);
};

export const formatTime = (value) => {
  if (!value) {
    return '';
  }

  const textValue = value.toString();
  if (!textValue.includes('T')) {
    return textValue.slice(0, 5);
  }

  const timestamp = new Date(textValue);
  if (Number.isNaN(timestamp.getTime())) {
    return textValue.split('T')[1].slice(0, 5);
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APPOINTMENT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(timestamp);
};

export const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const normalized = value.includes('T') ? value.split('T')[0] : value;
  if (value.includes('T')) {
    const timestamp = new Date(value);
    if (!Number.isNaN(timestamp.getTime())) {
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: APPOINTMENT_TIME_ZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(timestamp);
    }
  }

  const [year, month, day] = normalized.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

export const appointmentDateTimeToIso = (date, time) => (
  dateTimeInAppointmentTimeZone(date, time).toISOString()
);

export const formatCurrency = (value) => (
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
);

export const calculateAppointmentEnd = (date, time, durationInMinutes) => {
  const startDate = dateTimeInAppointmentTimeZone(date, time);
  startDate.setUTCMinutes(startDate.getUTCMinutes() + Number(durationInMinutes || 60));
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
