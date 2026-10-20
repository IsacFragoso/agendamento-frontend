export const ACTIVE_STATUSES = ['PENDENTE', 'CONFIRMADO'];

export const HISTORY_STATUS_OPTIONS = [
  ['TODOS', 'Todos'],
  ['CONCLUIDO', 'Concluídos'],
  ['CANCELADO', 'Cancelados'],
];

export const HISTORY_PERIOD_OPTIONS = [
  ['TODOS', 'Todo o período'],
  ['1', 'Último mês'],
  ['3', 'Últimos 3 meses'],
  ['6', 'Últimos 6 meses'],
  ['12', 'Último ano'],
];

const providerName = (appointment) => appointment.prestador?.usuario?.nome_completo || 'Profissional';
const price = (appointment) => Number(appointment.servico?.preco) || 0;
const startsAt = (appointment) => new Date(appointment.data_hora_inicio);

export const getHistoryAppointments = (appointments) => appointments
  .filter((item) => !ACTIVE_STATUSES.includes(item.status))
  .sort((left, right) => startsAt(right) - startsAt(left));

export function filterHistory(history, { search = '', status = 'TODOS', months = 'TODOS' }, now = new Date()) {
  const query = search.trim().toLowerCase();
  const cutoff = months === 'TODOS' ? null : new Date(now.getFullYear(), now.getMonth() - Number(months), now.getDate());

  return history.filter((item) => {
    if (status !== 'TODOS' && item.status !== status) return false;
    if (cutoff && startsAt(item) < cutoff) return false;
    if (!query) return true;
    return `${item.servico?.titulo || ''} ${providerName(item)}`.toLowerCase().includes(query);
  });
}

export function getHistoryStats(appointments) {
  const completed = appointments.filter((item) => item.status === 'CONCLUIDO');
  const cancelled = appointments.filter((item) => item.status === 'CANCELADO');
  const finished = completed.length + cancelled.length;
  const totalSpent = completed.reduce((sum, item) => sum + price(item), 0);

  const visits = new Map();
  completed.forEach((item) => {
    const key = item.id_prestador ?? providerName(item);
    const entry = visits.get(key) || { name: providerName(item), photo: item.prestador?.usuario?.foto_perfil, count: 0 };
    entry.count += 1;
    visits.set(key, entry);
  });
  const topProvider = [...visits.values()].sort((left, right) => right.count - left.count)[0] || null;

  return {
    total: appointments.length,
    completionRate: finished ? Math.round((completed.length / finished) * 100) : null,
    topProvider,
    totalSpent,
    averageSpent: completed.length ? totalSpent / completed.length : 0,
    completedCount: completed.length,
  };
}
