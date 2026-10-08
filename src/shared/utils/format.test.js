import { describe, expect, it } from 'vitest';
import {
  appointmentDateTimeToIso,
  calculateAppointmentEnd,
  formatDate,
  formatTime,
} from './format';

describe('appointment time formatting', () => {
  it('converts Sao Paulo appointment times to UTC and preserves duration', () => {
    expect(appointmentDateTimeToIso('2026-09-30', '09:00')).toBe('2026-09-30T12:00:00.000Z');
    expect(calculateAppointmentEnd('2026-09-30', '09:00', 60)).toBe('2026-09-30T13:00:00.000Z');
  });

  it('formats UTC timestamps as Sao Paulo local date and time', () => {
    expect(formatDate('2026-09-30T02:00:00.000Z')).toBe('29/09/2026');
    expect(formatTime('2026-09-30T12:00:00.000Z')).toBe('09:00');
  });
});