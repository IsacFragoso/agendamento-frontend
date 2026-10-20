import { describe, expect, it } from 'vitest';
import { filterHistory, getHistoryAppointments, getHistoryStats } from './client-history';

const make = (id, status, date, price, provider = 'Ana', providerId = 1) => ({
  id_agendamento: id,
  status,
  id_prestador: providerId,
  data_hora_inicio: date,
  servico: { titulo: `Serviço ${id}`, preco: price },
  prestador: { usuario: { nome_completo: provider } },
});

const appointments = [
  make(1, 'CONCLUIDO', '2026-09-10T10:00:00Z', '100'),
  make(2, 'CONCLUIDO', '2026-08-01T10:00:00Z', '50'),
  make(3, 'CANCELADO', '2026-07-01T10:00:00Z', '80', 'Bia', 2),
  make(4, 'PENDENTE', '2026-11-01T10:00:00Z', '70'),
];

describe('client history', () => {
  it('excludes active appointments and sorts newest first', () => {
    expect(getHistoryAppointments(appointments).map((item) => item.id_agendamento)).toEqual([1, 2, 3]);
  });

  it('computes totals, completion rate, top provider and spending', () => {
    const stats = getHistoryStats(appointments);
    expect(stats.total).toBe(4);
    expect(stats.completionRate).toBe(67);
    expect(stats.topProvider).toMatchObject({ name: 'Ana', count: 2 });
    expect(stats.totalSpent).toBe(150);
    expect(stats.averageSpent).toBe(75);
  });

  it('filters by status, period and search', () => {
    const history = getHistoryAppointments(appointments);
    const now = new Date('2026-10-19T12:00:00Z');
    expect(filterHistory(history, { status: 'CANCELADO' }, now)).toHaveLength(1);
    expect(filterHistory(history, { months: '3' }, now)).toHaveLength(2);
    expect(filterHistory(history, { search: 'bia' }, now)).toHaveLength(1);
  });
});
