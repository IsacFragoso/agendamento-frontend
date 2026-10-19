import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PROVIDER_SECTIONS, getProviderPath } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { useProviderAppointments } from '../../appointments/hooks/useProviderAppointments';
import PageHeader from '../../../shared/components/ui/PageHeader';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { formatCurrency, formatDate, formatTime } from '../../../shared/utils/format';
import './dashboards.css';

const appointmentId = (appointment) => appointment.id_agendamento || appointment.id;
const PANEL_LIMIT = 3;
const PENDING_PAGE_SIZE = 5;

export default function ProviderDashboardPage() {
  const { section } = useParams();
  const activeSection = PROVIDER_SECTIONS.includes(section) ? section : 'inicio';
  const { token, user } = useAuth();
  const appointments = useProviderAppointments({ token });
  const [historySearch, setHistorySearch] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [completionAppointment, setCompletionAppointment] = useState(null);
  const [detailsAppointment, setDetailsAppointment] = useState(null);

  useEffect(() => {
    if ((!completionAppointment && !detailsAppointment) || (completionAppointment && appointments.isSubmitting)) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setCompletionAppointment(null);
        setDetailsAppointment(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completionAppointment, detailsAppointment, appointments.isSubmitting]);

  const completeAppointment = async () => {
    const updated = await appointments.changeAppointmentStatus(
      appointmentId(completionAppointment),
      'CONCLUIDO',
    );
    if (updated) setCompletionAppointment(null);
  };

  const pending = appointments.appointments
    .filter((item) => item.status === 'PENDENTE')
    .sort((left, right) => new Date(left.data_criacao || left.data_hora_inicio) - new Date(right.data_criacao || right.data_hora_inicio));
  const pendingPageCount = Math.max(1, Math.ceil(pending.length / PENDING_PAGE_SIZE));
  const currentPendingPage = Math.min(pendingPage, pendingPageCount);
  const visiblePending = pending.slice(
    (currentPendingPage - 1) * PENDING_PAGE_SIZE,
    currentPendingPage * PENDING_PAGE_SIZE,
  );
  const confirmed = appointments.appointments
    .filter((item) => item.status === 'CONFIRMADO')
    .sort((left, right) => new Date(left.data_hora_inicio) - new Date(right.data_hora_inicio));
  const todayKey = new Date().toLocaleDateString('en-CA');
  const todayAppointments = confirmed.filter((item) => new Date(item.data_hora_inicio).toLocaleDateString('en-CA') === todayKey);
  const recentAppointments = [...appointments.appointments]
    .sort((first, second) => new Date(second.data_hora_inicio) - new Date(first.data_hora_inicio))
    .slice(0, 5);
  const requestSections = [
    { key: 'pendentes', eyebrow: 'Aguardando resposta', title: 'Solicitações pendentes', items: pending, empty: 'Nenhuma solicitação aguardando resposta.' },
    { key: 'confirmados', eyebrow: 'Agenda', title: 'Agendamentos confirmados', items: confirmed, empty: 'Nenhum agendamento confirmado.' },
  ];
  const historyAppointments = appointments.appointments
    .filter((item) => ['CONCLUIDO', 'CANCELADO'].includes(item.status))
    .filter((item) => `${item.cliente?.nome_completo || ''} ${item.servico?.titulo || ''}`.toLowerCase().includes(historySearch.toLowerCase()));
  const stats = {
    pending: pending.length,
    confirmed: confirmed.length,
  };

  return (
    <main className="dashboard-page">
      <PageHeader
        title={activeSection === 'inicio' ? `Olá, ${user?.nome_completo || 'Prestador'}` : (activeSection === 'historico' ? 'Histórico de atendimentos' : 'Agendamentos')}
        subtitle={activeSection === 'inicio' ? 'Acompanhe sua rotina e mantenha seu trabalho em dia.' : ''}
      />
      {appointments.errorMessage ? <p className="feedback feedback--danger">{appointments.errorMessage}</p> : null}
      {appointments.feedbackMessage ? <p className="feedback feedback--success">{appointments.feedbackMessage}</p> : null}

      {activeSection === 'inicio' ? (
        <>
          <section className="dashboard-welcome dashboard-welcome--provider">
            <div>
              <span>Seu espaço de trabalho</span>
              <h2>Uma agenda organizada começa com boas respostas.</h2>
              <p>Confira o que precisa de atenção e mantenha sua disponibilidade atualizada.</p>
              <Link className="button button--primary" to={getProviderPath('agenda')}>Ver solicitações <span aria-hidden="true">→</span></Link>
            </div>
            <div className="dashboard-welcome__art" aria-hidden="true"><span>✦</span><i /><b /></div>
          </section>

          <section className="dashboard-stats" aria-label="Resumo profissional">
            <article><span>Solicitações pendentes</span><strong>{stats.pending}</strong><small>Aguardando sua resposta</small></article>
            <article><span>Agendamentos confirmados</span><strong>{stats.confirmed}</strong><small>Próximos atendimentos</small></article>
            <article><span>Atendimentos de hoje</span><strong>{todayAppointments.length}</strong><small>Horários confirmados</small></article>
          </section>

          <div className="dashboard-columns provider-agenda-grid">
            <section className="dashboard-panel">
              <div className="dashboard-panel__heading"><div><p className="dashboard-eyebrow">Hoje</p><h2>Agenda do dia</h2></div><span className="provider-today__date">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></div>
              {!todayAppointments.length ? <p className="dashboard-empty">Nenhum atendimento confirmado para hoje.</p> : null}
              <div className="provider-panel__list">
                {todayAppointments.slice(0, PANEL_LIMIT).map((appointment) => (
                  <article className="today-item" key={appointmentId(appointment)}>
                    <time>{formatTime(appointment.data_hora_inicio)}</time>
                    <div>
                      <strong>{appointment.servico?.titulo || 'Atendimento'}</strong>
                      <span>{appointment.cliente?.nome_completo || 'Cliente'}</span>
                    </div>
                    <button className="today-item__details" type="button" onClick={() => setDetailsAppointment(appointment)}>
                      Ver detalhes
                    </button>
                  </article>
                ))}
              </div>
              {todayAppointments.length > PANEL_LIMIT ? (
                <p className="provider-panel__notice">Mostrando {PANEL_LIMIT} de {todayAppointments.length} atendimentos. <Link to={getProviderPath('agenda')}>Abrir agenda completa</Link></p>
              ) : null}
            </section>
            <section className="dashboard-panel">
              <div className="dashboard-panel__heading"><div><p className="dashboard-eyebrow">Caixa de entrada</p><h2>Solicitações pendentes</h2></div><span className="provider-pending-count">{pending.length}</span></div>
              {!pending.length ? <p className="dashboard-empty">Nenhuma solicitação aguardando resposta.</p> : null}
              <div className="provider-panel__list">
                {pending.slice(0, PANEL_LIMIT).map((appointment) => <article className="overview-request" key={appointmentId(appointment)}><div><strong>{appointment.cliente?.nome_completo || 'Cliente'}</strong><span>{appointment.servico?.titulo || 'Serviço'}</span><small>{formatDate(appointment.data_hora_inicio)} · {formatTime(appointment.data_hora_inicio)}</small></div><StatusBadge status={appointment.status} /></article>)}
              </div>
              {pending.length > PANEL_LIMIT ? (
                <p className="provider-panel__notice">Mostrando {PANEL_LIMIT} de {pending.length} solicitações. <Link to={getProviderPath('agenda')}>Abrir agenda completa</Link></p>
              ) : null}
            </section>
          </div>

          <section className="dashboard-panel" aria-labelledby="provider-recent-history">
            <div className="dashboard-panel__heading">
              <div><p className="dashboard-eyebrow">Atividade</p><h2 id="provider-recent-history">Histórico recente</h2></div>
              <Link className="button button--secondary provider-history-link" to={getProviderPath('historico')}>Histórico completo <span aria-hidden="true">→</span></Link>
            </div>
            {appointments.isLoading ? <p className="dashboard-empty">Carregando histórico...</p> : null}
            {!appointments.isLoading && !recentAppointments.length ? <p className="dashboard-empty">Seus agendamentos aparecerão aqui.</p> : null}
            {recentAppointments.length ? (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead><tr><th>Cliente</th><th>Serviço</th><th>Data e hora</th><th>Status</th></tr></thead>
                  <tbody>{recentAppointments.map((appointment) => (
                    <tr key={appointmentId(appointment)}>
                      <td>{appointment.cliente?.nome_completo || 'Cliente'}</td>
                      <td>{appointment.servico?.titulo || 'Serviço'}</td>
                      <td>{formatDate(appointment.data_hora_inicio)} · {formatTime(appointment.data_hora_inicio)}</td>
                      <td><StatusBadge status={appointment.status} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      {activeSection === 'agenda' ? (
        <div className="provider-request-sections">
          {appointments.isLoading && !appointments.appointments.length ? <p className="dashboard-empty">Carregando solicitações...</p> : null}
          {requestSections.map((requestSection) => (
            <section className="dashboard-panel" key={requestSection.key} aria-labelledby={`requests-${requestSection.key}`}>
              <div className="dashboard-panel__heading">
                <div><p className="dashboard-eyebrow">{requestSection.eyebrow}</p><h2 id={`requests-${requestSection.key}`}>{requestSection.title}</h2></div>
                <span className="provider-pending-count">{requestSection.items.length}</span>
              </div>
              {!appointments.isLoading && !requestSection.items.length ? <div className="dashboard-empty"><span aria-hidden="true">▦</span><p>{requestSection.empty}</p></div> : null}
          <div className="provider-request-list">
            {(requestSection.key === 'pendentes' ? visiblePending : requestSection.items).map((appointment) => (
              <article className={`provider-request ${appointment.status === 'PENDENTE' ? 'provider-request--pending' : ''}`} key={appointmentId(appointment)}>
                <div className="provider-request__top">
                  <div className="provider-request__avatar">{appointment.cliente?.nome_completo?.slice(0, 1) || 'C'}</div>
                  <div className="provider-request__identity"><strong>{appointment.cliente?.nome_completo || 'Cliente'}</strong><span>{appointment.data_criacao ? `Solicitado em ${formatDate(appointment.data_criacao)} às ${formatTime(appointment.data_criacao)}` : (appointment.status === 'PENDENTE' ? 'Nova solicitação' : 'Agendamento confirmado')}</span></div>
                  <StatusBadge status={appointment.status} />
                </div>
                <div className="provider-request__service"><strong>{appointment.servico?.titulo || 'Serviço'}</strong></div>
                <div className="provider-request__facts">
                  <div className="provider-request__fact provider-request__fact--date">
                    <small>Data do atendimento</small>
                    <strong>{formatDate(appointment.data_hora_inicio)} · {formatTime(appointment.data_hora_inicio)}</strong>
                  </div>
                  <div className="provider-request__fact">
                    <small>Valor</small>
                    <strong>{formatCurrency(appointment.servico?.preco)}</strong>
                  </div>
                  <div className="provider-request__fact">
                    <small>Duração</small>
                    <strong>{appointment.servico?.duracao_padrao || '—'} min</strong>
                  </div>
                </div>
                {appointment.status === 'PENDENTE' ? (
                  <div className="provider-request__actions">
                    <button className="button button--primary" type="button" disabled={appointments.isSubmitting} onClick={() => appointments.changeAppointmentStatus(appointmentId(appointment), 'CONFIRMADO')}>Aceitar proposta</button>
                    <button className="button button--secondary" type="button" disabled={appointments.isSubmitting} onClick={() => appointments.changeAppointmentStatus(appointmentId(appointment), 'CANCELADO')}>Recusar</button>
                  </div>
                ) : null}
                {appointment.status === 'CONFIRMADO' ? (
                  <div className="provider-request__actions provider-request__actions--single">
                    <button
                      className="button button--secondary"
                      type="button"
                      disabled={appointments.isSubmitting}
                      onClick={() => setCompletionAppointment(appointment)}
                    >
                      Marcar como concluído
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
              {requestSection.key === 'pendentes' && pendingPageCount > 1 ? (
                <nav className="provider-request-pagination" aria-label="Paginação de solicitações pendentes">
                  <button type="button" disabled={currentPendingPage === 1} onClick={() => setPendingPage((page) => Math.max(1, page - 1))}>Anterior</button>
                  <span>Página {currentPendingPage} de {pendingPageCount}</span>
                  <button type="button" disabled={currentPendingPage === pendingPageCount} onClick={() => setPendingPage((page) => Math.min(pendingPageCount, page + 1))}>Próxima</button>
                </nav>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}

      {activeSection === 'historico' ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel__heading dashboard-panel__heading--stack-mobile"><div><p className="dashboard-eyebrow">Registros</p><h2>Atendimentos anteriores</h2></div><label className="dashboard-search"><span aria-hidden="true">⌕</span><input aria-label="Buscar no histórico" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Buscar cliente ou serviço" /></label></div>
          <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Cliente</th><th>Serviço</th><th>Data e hora</th><th>Valor</th><th>Status</th></tr></thead><tbody>{historyAppointments.map((appointment) => <tr key={appointmentId(appointment)}><td>{appointment.cliente?.nome_completo || 'Cliente'}</td><td>{appointment.servico?.titulo || 'Serviço'}</td><td>{formatDate(appointment.data_hora_inicio)} · {formatTime(appointment.data_hora_inicio)}</td><td>{formatCurrency(appointment.servico?.preco)}</td><td><StatusBadge status={appointment.status} /></td></tr>)}</tbody></table>{!appointments.isLoading && !historyAppointments.length ? <p className="dashboard-empty">Nenhum atendimento anterior encontrado.</p> : null}</div>
        </section>
      ) : null}

      {completionAppointment ? (
        <div
          className="provider-completion-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !appointments.isSubmitting) {
              setCompletionAppointment(null);
            }
          }}
        >
          <section
            className="provider-completion-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-completion-title"
          >
            <h2 id="provider-completion-title">Marcar atendimento como concluído?</h2>
            <p>
              Confirme que o atendimento de <strong>{completionAppointment.cliente?.nome_completo || 'este cliente'}</strong>
              {' '}para <strong>{completionAppointment.servico?.titulo || 'este serviço'}</strong> foi realizado.
              Você pode confirmar mesmo que tenha terminado antes ou acontecido em outro horário.
            </p>
            {appointments.errorMessage ? (
              <p className="feedback feedback--danger" role="alert">{appointments.errorMessage}</p>
            ) : null}
            <div className="provider-completion-dialog__actions">
              <button
                className="button button--secondary"
                type="button"
                disabled={appointments.isSubmitting}
                onClick={() => setCompletionAppointment(null)}
              >
                Voltar
              </button>
              <button
                className="button button--primary"
                type="button"
                disabled={appointments.isSubmitting}
                onClick={completeAppointment}
              >
                {appointments.isSubmitting ? 'Salvando...' : 'Confirmar conclusão'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {detailsAppointment ? (
        <div
          className="provider-completion-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsAppointment(null);
          }}
        >
          <section
            className="provider-completion-dialog provider-appointment-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-appointment-title"
          >
            <h2 id="provider-appointment-title">Detalhes do atendimento</h2>
            <dl className="provider-appointment-details">
              <div><dt>Serviço</dt><dd>{detailsAppointment.servico?.titulo || 'Atendimento'}</dd></div>
              <div><dt>Cliente</dt><dd>{detailsAppointment.cliente?.nome_completo || 'Cliente'}</dd></div>
              <div><dt>Data</dt><dd>{formatDate(detailsAppointment.data_hora_inicio)}</dd></div>
              <div><dt>Horário</dt><dd>{formatTime(detailsAppointment.data_hora_inicio)}</dd></div>
              <div><dt>Duração</dt><dd>{detailsAppointment.servico?.duracao_padrao || '—'} min</dd></div>
              <div><dt>Valor</dt><dd>{formatCurrency(detailsAppointment.servico?.preco)}</dd></div>
              {detailsAppointment.data_criacao ? (
                <div><dt>Solicitado em</dt><dd>{formatDate(detailsAppointment.data_criacao)} às {formatTime(detailsAppointment.data_criacao)}</dd></div>
              ) : null}
            </dl>
            <div className="provider-completion-dialog__actions">
              <button className="button button--primary" type="button" onClick={() => setDetailsAppointment(null)}>Fechar</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}