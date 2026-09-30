import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CLIENT_SECTIONS, getClientPath } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { useClientAppointments } from '../../appointments/hooks/useClientAppointments';
import PageHeader from '../../../shared/components/ui/PageHeader';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { formatDate, formatTime } from '../../../shared/utils/format';

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = CLIENT_SECTIONS.includes(section) ? section : 'agenda';
  const { token, user } = useAuth();
  const clientAppointments = useClientAppointments({ clientId: user?.id, token });

  useEffect(() => {
    if (!CLIENT_SECTIONS.includes(section)) {
      navigate(getClientPath(), { replace: true });
    }
  }, [navigate, section]);

  const stats = {
    totalAppointments: clientAppointments.appointments.length,
    pendingAppointments: clientAppointments.appointments.filter((item) => item.status === 'PENDENTE').length,
  };

  return (
    <div className="page-stack">
      <PageHeader
        title={activeSection === 'agenda' ? 'Meus agendamentos' : 'Histórico de agendamentos'}
        subtitle="Acompanhe suas solicitações e os respectivos status."
      />
        <section className="stats-grid">
          <article className="stat-card">
            <span>Total de agendamentos</span>
            <strong>{stats.totalAppointments}</strong>
          </article>
          <article className="stat-card">
            <span>Solicitações pendentes</span>
            <strong>{stats.pendingAppointments}</strong>
          </article>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h2>{activeSection === 'agenda' ? 'Agendamentos' : 'Histórico'}</h2>
              <p>Veja os serviços, prestadores e status das suas solicitações.</p>
            </div>
          </div>

          {clientAppointments.errorMessage ? <p className="feedback feedback--danger">{clientAppointments.errorMessage}</p> : null}
          {clientAppointments.isLoading ? <p className="meta-text">Carregando agendamentos...</p> : null}

          {!clientAppointments.isLoading && !clientAppointments.errorMessage && clientAppointments.appointments.length === 0 ? (
            <p className="empty-state">Nenhum agendamento encontrado. Explore profissionais no Dashboard.</p>
          ) : null}

          {clientAppointments.appointments.length > 0 ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Serviço</th>
                    <th>Prestador</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clientAppointments.appointments.map((appointment) => (
                    <tr key={appointment.id_agendamento || appointment.id}>
                      <td>{formatDate(appointment.data_hora_inicio)} às {formatTime(appointment.data_hora_inicio)}</td>
                      <td>{appointment.servico?.titulo || '-'}</td>
                      <td>{appointment.prestador?.usuario?.nome_completo || appointment.prestador?.id_prestador || '-'}</td>
                      <td><StatusBadge status={appointment.status} /></td>
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
