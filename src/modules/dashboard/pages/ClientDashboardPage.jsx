import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CLIENT_SECTIONS, ROUTE_PATHS } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { useClientAppointments } from '../../appointments/hooks/useClientAppointments';
import AccountSettingsPanel from '../../../shared/components/AccountSettingsPanel';
import ClientHistory from '../components/ClientHistory';
import PageHeader from '../../../shared/components/ui/PageHeader';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { formatCurrency, formatDate, formatTime } from '../../../shared/utils/format';
import './dashboards.css';

const appointmentId = (appointment) => appointment.id_agendamento || appointment.id;
const appointmentDate = (appointment) => new Date(appointment.data_hora_inicio);

export default function ClientDashboardPage() {
  const { section } = useParams();
  const activeSection = CLIENT_SECTIONS.includes(section) ? section : 'agendamentos';
  const { token, user } = useAuth();
  const appointments = useClientAppointments({ clientId: user?.id, token });
  const [appointmentFilter, setAppointmentFilter] = useState('TODOS');

  const upcoming = useMemo(() => appointments.appointments
    .filter((item) => ['PENDENTE', 'CONFIRMADO'].includes(item.status))
    .sort((left, right) => appointmentDate(left) - appointmentDate(right)), [appointments.appointments]);
  const visibleAppointments = appointmentFilter === 'TODOS'
    ? upcoming
    : upcoming.filter((item) => item.status === appointmentFilter);

  return (
    <main className="dashboard-page">
      <PageHeader
        title={{ agendamentos: 'Meus agendamentos', historico: 'Histórico de Agendamentos', perfil: 'Configurações' }[activeSection]}
        subtitle={activeSection === 'historico' ? 'Revise e gerencie suas reservas e sessões anteriores.' : ''}
      />

      {appointments.errorMessage ? <p className="feedback feedback--danger">{appointments.errorMessage}</p> : null}
      {appointments.feedbackMessage ? <p className="feedback feedback--success">{appointments.feedbackMessage}</p> : null}

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
        <ClientHistory appointments={appointments.appointments} isLoading={appointments.isLoading} />
      ) : null}

      {activeSection === 'perfil' ? <AccountSettingsPanel /> : null}
    </main>
  );
}