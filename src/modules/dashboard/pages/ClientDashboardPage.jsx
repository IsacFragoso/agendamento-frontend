import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CLIENT_SECTIONS, ROUTE_PATHS, getClientPath } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { useClientAppointments } from '../../appointments/hooks/useClientAppointments';
import AppLayout from '../../../shared/components/layouts/AppLayout';
import AccountSettingsPanel from '../../../shared/components/AccountSettingsPanel';
import PageHeader from '../../../shared/components/ui/PageHeader';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { formatCurrency, formatDate, formatTime } from '../../../shared/utils/format';
import './dashboards.css';

const CLIENT_MENU_ITEMS = [
  { label: 'Visão geral', icon: '⌂', to: getClientPath('agenda') },
  { label: 'Agendamentos', icon: '▦', to: getClientPath('agendamentos') },
  { label: 'Histórico', icon: '↺', to: getClientPath('historico') },
  { label: 'Explorar', icon: '⌕', to: ROUTE_PATHS.marketplace },
  { label: 'Configurações', icon: '⚙', to: getClientPath('perfil') },
];

const appointmentId = (appointment) => appointment.id_agendamento || appointment.id;
const appointmentDate = (appointment) => new Date(appointment.data_hora_inicio);

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = CLIENT_SECTIONS.includes(section) ? section : 'agenda';
  const { logout, token, user } = useAuth();
  const appointments = useClientAppointments({ clientId: user?.id, token });
  const [appointmentFilter, setAppointmentFilter] = useState('TODOS');
  const [historySearch, setHistorySearch] = useState('');

  const upcoming = useMemo(() => appointments.appointments
    .filter((item) => ['PENDENTE', 'CONFIRMADO'].includes(item.status))
    .sort((left, right) => appointmentDate(left) - appointmentDate(right)), [appointments.appointments]);
  const completed = appointments.appointments.filter((item) => item.status === 'CONCLUIDO');
  const visibleAppointments = appointmentFilter === 'TODOS'
    ? upcoming
    : upcoming.filter((item) => item.status === appointmentFilter);
  const visibleHistory = appointments.appointments
    .filter((item) => !['PENDENTE', 'CONFIRMADO'].includes(item.status))
    .filter((item) => `${item.servico?.titulo || ''} ${item.prestador?.usuario?.nome_completo || ''}`.toLowerCase().includes(historySearch.toLowerCase()));
  const nextAppointment = upcoming.find((item) => item.status === 'CONFIRMADO') || upcoming[0];

  const handleLogout = () => {
    logout();
    navigate(ROUTE_PATHS.marketplace, { replace: true });
  };

  return (
    <AppLayout menuItems={CLIENT_MENU_ITEMS}>
      <main className="dashboard-page">
        <PageHeader
          title={activeSection === 'agenda' ? `Olá, ${user?.nome_completo || 'Cliente'}` : ({ agendamentos: 'Meus agendamentos', historico: 'Histórico de atendimentos', perfil: 'Configurações' }[activeSection])}
          subtitle={activeSection === 'agenda' ? 'Encontre um serviço para você ou acompanhe seus próximos horários.' : ''}
          actions={(
            <button className="button button--secondary" type="button" onClick={handleLogout}>Sair</button>
          )}
        />

        {appointments.errorMessage ? <p className="feedback feedback--danger">{appointments.errorMessage}</p> : null}
        {appointments.feedbackMessage ? <p className="feedback feedback--success">{appointments.feedbackMessage}</p> : null}

        {activeSection === 'agenda' ? (
          <>
            <section className="dashboard-welcome dashboard-welcome--client">
              <div>
                <span>Seu próximo cuidado começa aqui</span>
                <h2>Um bom profissional muda o seu dia.</h2>
                <p>Descubra especialistas da sua região e escolha um horário que funcione para você.</p>
                <Link className="button button--primary" to={ROUTE_PATHS.marketplace}>Explorar profissionais <span aria-hidden="true">→</span></Link>
              </div>
              <div className="dashboard-welcome__art" aria-hidden="true"><span>✦</span><i /><b /></div>
            </section>

            <section className="dashboard-stats" aria-label="Resumo da conta">
              <article><span>Próximos horários</span><strong>{upcoming.length}</strong><small>Solicitações e confirmações</small></article>
              <article><span>Aguardando resposta</span><strong>{upcoming.filter((item) => item.status === 'PENDENTE').length}</strong><small>O profissional ainda vai confirmar</small></article>
              <article><span>Atendimentos concluídos</span><strong>{completed.length}</strong><small>Seu histórico de serviços</small></article>
            </section>

            <div className="dashboard-columns">
              <section className="dashboard-panel">
                <div className="dashboard-panel__heading">
                  <div><p className="dashboard-eyebrow">Sua agenda</p><h2>Próximos compromissos</h2></div>
                  <Link to={getClientPath('agendamentos')}>Ver todos <span aria-hidden="true">→</span></Link>
                </div>
                {appointments.isLoading ? <p className="dashboard-empty">Carregando seus agendamentos...</p> : null}
                {!appointments.isLoading && nextAppointment ? (
                  <article className="next-appointment">
                    <div className="next-appointment__date"><strong>{appointmentDate(nextAppointment).getDate()}</strong><span>{appointmentDate(nextAppointment).toLocaleDateString('pt-BR', { month: 'short' })}</span></div>
                    <div className="next-appointment__details">
                      <strong>{nextAppointment.servico?.titulo || 'Atendimento'}</strong>
                      <span>{nextAppointment.prestador?.usuario?.nome_completo || 'Profissional'} · {formatTime(nextAppointment.data_hora_inicio)}</span>
                      <StatusBadge status={nextAppointment.status} />
                    </div>
                    <span className="next-appointment__price">{formatCurrency(nextAppointment.servico?.preco)}</span>
                  </article>
                ) : null}
                {!appointments.isLoading && !nextAppointment ? (
                  <div className="dashboard-empty"><span aria-hidden="true">▦</span><p>Ainda não há horários próximos.</p><Link to={ROUTE_PATHS.marketplace}>Encontrar um serviço</Link></div>
                ) : null}
              </section>

              <aside className="dashboard-panel dashboard-discover">
                <p className="dashboard-eyebrow">Descobrir</p>
                <h2>Tem algo em mente?</h2>
                <p>Busque por serviço, categoria ou nome de profissional.</p>
                <Link className="dashboard-discover__link" to={ROUTE_PATHS.marketplace}>Abrir catálogo <span aria-hidden="true">↗</span></Link>
                <div className="dashboard-discover__line" />
                <small>Solicitações pendentes podem ser alteradas pelo profissional.</small>
              </aside>
            </div>
          </>
        ) : null}

        {activeSection === 'agendamentos' ? (
          <section className="dashboard-panel">
            <div className="dashboard-panel__heading dashboard-panel__heading--stack-mobile">
              <div><p className="dashboard-eyebrow">Agenda</p><h2>Solicitações e próximos horários</h2></div>
              <div className="dashboard-tabs" role="group" aria-label="Filtrar agendamentos">
                {[['TODOS', 'Todos'], ['PENDENTE', 'Pendentes'], ['CONFIRMADO', 'Confirmados']].map(([value, label]) => (
                  <button className={appointmentFilter === value ? 'is-active' : ''} key={value} type="button" onClick={() => setAppointmentFilter(value)}>{label}</button>
                ))}
              </div>
            </div>
            {appointments.isLoading ? <p className="dashboard-empty">Carregando seus agendamentos...</p> : null}
            {!appointments.isLoading && visibleAppointments.length === 0 ? (
              <div className="dashboard-empty"><span aria-hidden="true">▦</span><p>Nenhum agendamento nesta lista.</p><Link to={ROUTE_PATHS.marketplace}>Explorar serviços</Link></div>
            ) : null}
            <div className="appointment-list">
              {visibleAppointments.map((appointment) => (
                <article className="appointment-row" key={appointmentId(appointment)}>
                  <div className="appointment-row__date"><span>{formatDate(appointment.data_hora_inicio)}</span><strong>{formatTime(appointment.data_hora_inicio)}</strong></div>
                  <div className="appointment-row__main"><strong>{appointment.servico?.titulo || 'Serviço'}</strong><span>{appointment.prestador?.usuario?.nome_completo || 'Profissional'}</span><small>{appointment.servico?.duracao_padrao || '—'} min</small></div>
                  <StatusBadge status={appointment.status} />
                  <strong className="appointment-row__price">{formatCurrency(appointment.servico?.preco)}</strong>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === 'historico' ? (
          <section className="dashboard-panel">
            <div className="dashboard-panel__heading dashboard-panel__heading--stack-mobile">
              <div><p className="dashboard-eyebrow">Registros</p><h2>Atendimentos anteriores</h2></div>
              <label className="dashboard-search"><span aria-hidden="true">⌕</span><input aria-label="Buscar no histórico" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Buscar serviço ou profissional" /></label>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead><tr><th>Serviço</th><th>Profissional</th><th>Data e hora</th><th>Valor</th><th>Status</th></tr></thead>
                <tbody>{visibleHistory.map((appointment) => (
                  <tr key={appointmentId(appointment)}>
                    <td>{appointment.servico?.titulo || 'Serviço'}</td>
                    <td>{appointment.prestador?.usuario?.nome_completo || 'Profissional'}</td>
                    <td>{formatDate(appointment.data_hora_inicio)} · {formatTime(appointment.data_hora_inicio)}</td>
                    <td>{formatCurrency(appointment.servico?.preco)}</td>
                    <td><StatusBadge status={appointment.status} /></td>
                  </tr>
                ))}</tbody>
              </table>
              {!appointments.isLoading && visibleHistory.length === 0 ? <p className="dashboard-empty">Nenhum atendimento encontrado no histórico.</p> : null}
            </div>
          </section>
        ) : null}

        {activeSection === 'perfil' ? <AccountSettingsPanel /> : null}
      </main>
    </AppLayout>
  );
}