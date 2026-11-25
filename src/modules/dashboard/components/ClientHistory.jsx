import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Eye, Search, Star } from 'lucide-react';
import IconActionButton from '../../../shared/components/ui/IconActionButton';
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

export default function ClientHistory({
  appointments,
  isLoading,
  onReview,
  onDetails,
  getClientReview = (appointment) => (appointment.avaliacoes || []).find((review) => review.avaliador_tipo === 'CLIENTE'),
  getProviderReview = (appointment) => (appointment.avaliacoes || []).find((review) => review.avaliador_tipo === 'PRESTADOR'),
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [months, setMonths] = useState('TODOS');
  const [historyPage, setHistoryPage] = useState(1);

  const stats = useMemo(() => getHistoryStats(appointments), [appointments]);
  const history = useMemo(() => getHistoryAppointments(appointments), [appointments]);
  const rows = useMemo(() => filterHistory(history, { search, status, months }), [history, search, status, months]);
  const historyPageSize = 10;
  const historyPageCount = Math.max(1, Math.ceil(rows.length / historyPageSize));
  const currentHistoryPage = Math.min(historyPage, historyPageCount);
  const visibleRows = rows.slice(
    (currentHistoryPage - 1) * historyPageSize,
    currentHistoryPage * historyPageSize,
  );


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
            onChange={(event) => { setSearch(event.target.value); setHistoryPage(1); }}
            placeholder="Buscar serviços, profissionais..."
          />
        </label>
        <label className="client-history__select">
          <span>Período</span>
          <select value={months} onChange={(event) => { setMonths(event.target.value); setHistoryPage(1); }}>
            {HISTORY_PERIOD_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="client-history__select">
          <span>Status</span>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setHistoryPage(1); }}>
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
                <tr><th>Profissional</th><th>Serviço</th><th>Data e hora</th><th>Status</th><th>Avaliação</th><th>Ação</th></tr>
              </thead>
              <tbody>
                {visibleRows.map((appointment) => (
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
                      {(() => {
                        const displayedReview = getClientReview(appointment) || getProviderReview(appointment);
                        return displayedReview ? (
                          <span className="history-review-value" title={displayedReview.comentario || 'Sem comentário'}>
                            {displayedReview.nota_estrelas}
                            <Star size={14} fill="currentColor" aria-hidden="true" />
                          </span>
                        ) : (
                          <span className="history-review-empty">—</span>
                        );
                      })()}
                    </td>
                    <td>
                      <div className="client-history__actions">
                        {appointment.status === 'CONCLUIDO' && onReview && !getClientReview(appointment) ? (
                          <IconActionButton
                            label="Avaliar profissional"
                            icon={<Star size={16} aria-hidden="true" />}
                            onClick={() => onReview(appointment)}
                          />
                        ) : null}
                        {appointment.id_prestador && appointment.id_servico ? (
                          <Link className="history-icon-button" title="Agendar novamente" aria-label="Agendar novamente" to={getBookingPath(appointment.id_prestador, appointment.id_servico)}>
                            <CalendarPlus size={16} aria-hidden="true" />
                          </Link>
                        ) : null}
                        {onDetails ? (
                          <IconActionButton
                            label="Ver detalhes do atendimento"
                            icon={<Eye size={16} aria-hidden="true" />}
                            onClick={() => onDetails(appointment)}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {rows.length > historyPageSize ? (
          <nav className="history-pagination" aria-label="Paginação do histórico">
            <button type="button" disabled={currentHistoryPage === 1} onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}>
              Anterior
            </button>
            <span>Página {currentHistoryPage} de {historyPageCount}</span>
            <button type="button" disabled={currentHistoryPage === historyPageCount} onClick={() => setHistoryPage((page) => Math.min(historyPageCount, page + 1))}>
              Próxima
            </button>
          </nav>
        ) : null}
      </section>
    </div>
  );
}
