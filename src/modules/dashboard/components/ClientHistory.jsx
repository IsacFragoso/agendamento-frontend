import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getBookingPath } from '../../../core/router/paths';
import { PROFILE_PHOTO_PLACEHOLDER, handleProfilePhotoError } from '../../../shared/utils/profile-photo';
import { formatCurrency, formatDate, formatTime } from '../../../shared/utils/format';
import {
  HISTORY_PERIOD_OPTIONS,
  HISTORY_STATUS_OPTIONS,
  filterHistory,
  getHistoryAppointments,
  getHistoryStats,
} from '../utils/client-history';
import './ClientHistory.css';

const STATUS_LABELS = { CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' };
const STATUS_TONES = { CONCLUIDO: 'success', CANCELADO: 'danger' };

export default function ClientHistory({ appointments, isLoading }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [months, setMonths] = useState('TODOS');

  const stats = useMemo(() => getHistoryStats(appointments), [appointments]);
  const history = useMemo(() => getHistoryAppointments(appointments), [appointments]);
  const rows = useMemo(() => filterHistory(history, { search, status, months }), [history, search, status, months]);

  return (
    <div className="client-history">
      <section className="client-history__stats" aria-label="Resumo do histórico">
        <article>
          <span>Total de agendamentos</span>
          <strong>{stats.total}</strong>
          {stats.completionRate !== null ? <small className="is-positive">{stats.completionRate}% taxa de conclusão</small> : <small>Nenhum atendimento finalizado</small>}
        </article>
        <article>
          <span>Profissional mais visitado</span>
          {stats.topProvider ? (
            <>
              <div className="client-history__top-provider">
                <img src={stats.topProvider.photo || PROFILE_PHOTO_PLACEHOLDER} alt="" onError={handleProfilePhotoError} />
                <strong>{stats.topProvider.name}</strong>
              </div>
              <small>{stats.topProvider.count} {stats.topProvider.count === 1 ? 'sessão concluída' : 'sessões concluídas'}</small>
            </>
          ) : (
            <>
              <strong>—</strong>
              <small>Ainda sem sessões concluídas</small>
            </>
          )}
        </article>
        <article>
          <span>Gasto total</span>
          <strong>{formatCurrency(stats.totalSpent)}</strong>
          <small>{stats.completedCount ? `Média de ${formatCurrency(stats.averageSpent)} por atendimento` : 'Considera atendimentos concluídos'}</small>
        </article>
      </section>

      <section className="client-history__filters" aria-label="Filtros do histórico">
        <label className="client-history__search">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Buscar no histórico"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar serviços, profissionais..."
          />
        </label>
        <label className="client-history__select">
          <span>Período</span>
          <select value={months} onChange={(event) => setMonths(event.target.value)}>
            {HISTORY_PERIOD_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="client-history__select">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {HISTORY_STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </section>

      <section className="client-history__table-card">
        {isLoading ? <p className="dashboard-empty">Carregando seu histórico...</p> : null}
        {!isLoading && rows.length === 0 ? <p className="dashboard-empty">Nenhum atendimento encontrado no histórico.</p> : null}
        {rows.length ? (
          <div className="dashboard-table-wrap">
            <table className="client-history__table">
              <thead>
                <tr><th>Profissional</th><th>Serviço</th><th>Data e hora</th><th>Status</th><th>Ação</th></tr>
              </thead>
              <tbody>
                {rows.map((appointment) => (
                  <tr key={appointment.id_agendamento || appointment.id}>
                    <td>
                      <div className="client-history__provider">
                        <img
                          src={appointment.prestador?.usuario?.foto_perfil || PROFILE_PHOTO_PLACEHOLDER}
                          alt=""
                          onError={handleProfilePhotoError}
                        />
                        <strong>{appointment.prestador?.usuario?.nome_completo || 'Profissional'}</strong>
                      </div>
                    </td>
                    <td>{appointment.servico?.titulo || 'Serviço'}</td>
                    <td>{formatDate(appointment.data_hora_inicio)} · {formatTime(appointment.data_hora_inicio)}</td>
                    <td>
                      <span className={`status-badge status-badge--${STATUS_TONES[appointment.status] || 'neutral'}`}>
                        {STATUS_LABELS[appointment.status] || appointment.status}
                      </span>
                    </td>
                    <td>
                      {appointment.id_prestador && appointment.id_servico ? (
                        <Link className="client-history__action" to={getBookingPath(appointment.id_prestador, appointment.id_servico)}>
                          Agendar novamente
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
