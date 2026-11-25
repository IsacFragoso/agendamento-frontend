import { describe, expect, it } from 'vitest';
import {
  appointmentDateTimeToIso,
  calculateAppointmentEnd,
  formatDate,
  formatTime,
  normalizeScheduleItems,
} from './format';

describe('appointment time formatting', () => {
  it('converts Sao Paulo appointment times to UTC and preserves duration', () => {
    expect(appointmentDateTimeToIso('2026-09-30', '09:00')).toBe('2026-09-30T12:00:00.000Z');
    expect(calculateAppointmentEnd('2026-09-30', '09:00', 60)).toBe('2026-09-30T13:00:00.000Z');
  });

  describe('schedule formatting', () => {
    it('orders schedule intervals from Monday to Sunday and normalizes time fields', () => {
      const items = normalizeScheduleItems([
        { id_horario: 3, dia_semana: 0, hora_inicio: '09:00:00', hora_fim: '12:00:00' },
        { id_horario: 2, dia_semana: 2, hora_inicio: '14:00:00', hora_fim: '18:00:00' },
        { id_horario: 1, dia_semana: 1, hora_inicio: '08:00:00', hora_fim: '12:00:00' },
      ]);

      expect(items.map((item) => item.dia_semana)).toEqual([1, 2, 0]);
      expect(items[0]).toMatchObject({
        hora_inicio: '08:00',
        hora_fim: '12:00',
      });
    });
  });

  it('formats UTC timestamps as Sao Paulo local date and time', () => {
    expect(formatDate('2026-09-30T02:00:00.000Z')).toBe('29/09/2026');
    expect(formatTime('2026-09-30T12:00:00.000Z')).toBe('09:00');
  });
});