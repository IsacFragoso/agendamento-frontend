import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PROVIDER_SECTIONS, getProviderPath } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { useProviderAppointments } from '../../appointments/hooks/useProviderAppointments';
import PageHeader from '../../../shared/components/ui/PageHeader';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { formatCurrency, formatDate, formatTime } from '../../../shared/utils/format';
import './dashboards.css';

const appointmentId = (appointment) => appointment.id_agendamento || appointment.id;

export default function ProviderDashboardPage() {
  const { section } = useParams();
  const activeSection = PROVIDER_SECTIONS.includes(section) ? section : 'inicio';
  const { token, user } = useAuth();
  const appointments = useProviderAppointments({ token });
  const [appointmentFilter, setAppointmentFilter] = useState('PENDENTE');
  const [historySearch, setHistorySearch] = useState('');

  const pending = appointments.appointments.filter((item) => item.status === 'PENDENTE');
  const confirmed = appointments.appointments
    .filter((item) => item.status === 'CONFIRMADO')
    .sort((left, right) => new Date(left.data_hora_inicio) - new Date(right.data_hora_inicio));
  const todayKey = new Date().toLocaleDateString('en-CA');
  const todayAppointments = confirmed.filter((item) => new Date(item.data_hora_inicio).toLocaleDateString('en-CA') === todayKey);
  const filteredAppointments = appointmentFilter === 'TODOS'
    ? appointments.appointments
    : appointments.appointments.filter((item) => item.status === appointmentFilter);
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
              {todayAppointments.map((appointment) => <article className="today-item" key={appointmentId(appointment)}><time>{formatTime(appointment.data_hora_inicio)}</time><div><strong>{appointment.servico?.titulo || 'Atendimento'}</strong><span>{appointment.cliente?.nome_completo || 'Cliente'}</span></div></article>)}
            </section>
            <section className="dashboard-panel">
              <div className="dashboard-panel__heading"><div><p className="dashboard-eyebrow">Caixa de entrada</p><h2>Solicitações pendentes</h2></div><span className="provider-pending-count">{pending.length}</span></div>
              {!pending.length ? <p className="dashboard-empty">Nenhuma solicitação aguardando resposta.</p> : null}
              {pending.slice(0, 3).map((appointment) => <article className="overview-request" key={appointmentId(appointment)}><div><strong>{appointment.cliente?.nome_completo || 'Cliente'}</strong><span>{appointment.servico?.titulo || 'Serviço'}</span><small>{formatDate(appointment.data_hora_inicio)} · {formatTime(appointment.data_hora_inicio)}</small></div><StatusBadge status={appointment.status} /></article>)}
            </section>
          </div>
        </>
      ) : null}

      {activeSection === 'agenda' ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel__heading dashboard-panel__heading--stack-mobile">
            <div><p className="dashboard-eyebrow">Caixa de entrada</p><h2>Solicitações de agendamento</h2></div>
            <div className="dashboard-tabs" role="group" aria-label="Filtrar solicitações">
              {[['PENDENTE', 'Pendentes'], ['CONFIRMADO', 'Confirmados'], ['TODOS', 'Todas']].map(([value, label]) => <button className={appointmentFilter === value ? 'is-active' : ''} key={value} type="button" onClick={() => setAppointmentFilter(value)}>{label}</button>)}
            </div>
          </div>
          {appointments.isLoading ? <p className="dashboard-empty">Carregando solicitações...</p> : null}
          {!appointments.isLoading && !filteredAppointments.length ? <div className="dashboard-empty"><span aria-hidden="true">▦</span><p>Nenhuma solicitação nesta fila.</p></div> : null}
          <div className="provider-request-list">
            {filteredAppointments.map((appointment) => (
              <article className="provider-request" key={appointmentId(appointment)}>
                <div className="provider-request__top">
                  <div className="provider-request__avatar">{appointment.cliente?.nome_completo?.slice(0, 1) || 'C'}</div>
                  <div className="provider-request__identity"><strong>{appointment.cliente?.nome_completo || 'Cliente'}</strong><span>{appointment.status === 'PENDENTE' ? 'Nova solicitação' : 'Agendamento confirmado'}</span></div>
                  <StatusBadge status={appointment.status} />
                </div>
                <div className="provider-request__service"><strong>{appointment.servico?.titulo || 'Serviço'}</strong><span>{formatCurrency(appointment.servico?.preco)} · {appointment.servico?.duracao_padrao || '—'} min</span></div>
                <p className="provider-request__date">▦ {formatDate(appointment.data_hora_inicio)} às {formatTime(appointment.data_hora_inicio)}</p>
                {appointment.status === 'PENDENTE' ? (
                  <div className="provider-request__actions">
                    <button className="button button--primary" type="button" disabled={appointments.isSubmitting} onClick={() => appointments.changeAppointmentStatus(appointmentId(appointment), 'CONFIRMADO')}>Aceitar proposta</button>
                    <button className="button button--secondary" type="button" disabled={appointments.isSubmitting} onClick={() => appointments.changeAppointmentStatus(appointmentId(appointment), 'CANCELADO')}>Recusar</button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeSection === 'historico' ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel__heading dashboard-panel__heading--stack-mobile"><div><p className="dashboard-eyebrow">Registros</p><h2>Atendimentos anteriores</h2></div><label className="dashboard-search"><span aria-hidden="true">⌕</span><input aria-label="Buscar no histórico" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Buscar cliente ou serviço" /></label></div>
          <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Cliente</th><th>Serviço</th><th>Data e hora</th><th>Valor</th><th>Status</th></tr></thead><tbody>{historyAppointments.map((appointment) => <tr key={appointmentId(appointment)}><td>{appointment.cliente?.nome_completo || 'Cliente'}</td><td>{appointment.servico?.titulo || 'Serviço'}</td><td>{formatDate(appointment.data_hora_inicio)} · {formatTime(appointment.data_hora_inicio)}</td><td>{formatCurrency(appointment.servico?.preco)}</td><td><StatusBadge status={appointment.status} /></td></tr>)}</tbody></table>{!appointments.isLoading && !historyAppointments.length ? <p className="dashboard-empty">Nenhum atendimento anterior encontrado.</p> : null}</div>
        </section>
      ) : null}
    </main>
  );
}