import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CLIENT_SECTIONS, ROUTE_PATHS, getClientPath } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { useClientAppointments } from '../../appointments/hooks/useClientAppointments';
import { usePublicServices } from '../../services/hooks/usePublicServices';
import AppLayout from '../../../shared/components/layouts/AppLayout';
import PageHeader from '../../../shared/components/ui/PageHeader';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { formatCurrency, formatDate, formatTime } from '../../../shared/utils/format';

const CLIENT_MENU_ITEMS = [
  { label: 'Agenda', icon: '📅', to: getClientPath('agenda') },
  { label: 'Histórico', icon: '🕒', to: getClientPath('historico') },
  { label: 'Perfil', icon: '👤', to: getClientPath('perfil') },
];

const INITIAL_BOOKING_FORM = {
  date: '',
  time: '09:00',
};

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = CLIENT_SECTIONS.includes(section) ? section : 'agenda';
  const { logout, token, user } = useAuth();
  const publicServices = usePublicServices();
  const clientAppointments = useClientAppointments({ clientId: user?.id, token });
  const [selectedService, setSelectedService] = useState(null);
  const [bookingForm, setBookingForm] = useState(INITIAL_BOOKING_FORM);

  useEffect(() => {
    if (!CLIENT_SECTIONS.includes(section)) {
      navigate(getClientPath(), { replace: true });
    }
  }, [navigate, section]);

  const stats = useMemo(() => ({
    availableServices: publicServices.services.length,
    totalAppointments: clientAppointments.appointments.length,
    pendingAppointments: clientAppointments.appointments.filter((item) => item.status === 'PENDENTE').length,
  }), [clientAppointments.appointments, publicServices.services.length]);

  const handleLogout = () => {
    logout();
    navigate(ROUTE_PATHS.login, { replace: true });
  };

  const submitAppointment = async (event) => {
    event.preventDefault();
    const created = await clientAppointments.requestAppointment({
      service: selectedService,
      date: bookingForm.date,
      time: bookingForm.time,
    });

    if (created) {
      setSelectedService(null);
      setBookingForm(INITIAL_BOOKING_FORM);
    }
  };

  return (
    <AppLayout menuItems={CLIENT_MENU_ITEMS}>
      <div className="page-stack">
        <PageHeader
          title={`Olá, ${user?.nome_completo || 'Cliente'}`}
          subtitle="Explore serviços, envie solicitações de agendamento e acompanhe o histórico."
          actions={(
            <button className="button button--secondary" type="button" onClick={handleLogout}>
              Sair
            </button>
          )}
        />

        <section className="stats-grid">
          <article className="stat-card">
            <span>Serviços disponíveis</span>
            <strong>{stats.availableServices}</strong>
          </article>
          <article className="stat-card">
            <span>Meus agendamentos</span>
            <strong>{stats.totalAppointments}</strong>
          </article>
          <article className="stat-card">
            <span>Solicitações pendentes</span>
            <strong>{stats.pendingAppointments}</strong>
          </article>
        </section>

        {(activeSection === 'agenda' || activeSection === 'perfil') && (
          <section className="card">
            <div className="card__header">
              <div>
                <h2>Serviços disponíveis</h2>
                <p>Escolha um serviço e envie uma solicitação de agendamento.</p>
              </div>
            </div>

            {publicServices.errorMessage ? <p className="feedback feedback--danger">{publicServices.errorMessage}</p> : null}
            {publicServices.isLoading ? <p className="meta-text">Carregando catálogo...</p> : null}

            <div className="service-grid">
              {publicServices.services.map((service) => {
                const isSelected = (selectedService?.id_servico || selectedService?.id) === (service.id_servico || service.id);

                return (
                  <article className={`service-option ${isSelected ? 'is-selected' : ''}`} key={service.id_servico || service.id}>
                    <div className="service-option__header">
                      <div>
                        <strong>{service.titulo}</strong>
                        <p>{service.descricao}</p>
                      </div>
                    </div>
                    <p className="meta-text">{formatCurrency(service.preco)} · {service.duracao_padrao} min</p>
                    <button className="button button--primary" type="button" onClick={() => setSelectedService(service)}>
                      {isSelected ? 'Selecionado' : 'Selecionar'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {selectedService && (activeSection === 'agenda' || activeSection === 'perfil') ? (
          <section className="card card--highlighted">
            <div className="card__header">
              <div>
                <h2>Agendar serviço</h2>
                <p>{selectedService.titulo}</p>
              </div>
            </div>

            {clientAppointments.feedbackMessage ? <p className="feedback feedback--success">{clientAppointments.feedbackMessage}</p> : null}
            {clientAppointments.errorMessage ? <p className="feedback feedback--danger">{clientAppointments.errorMessage}</p> : null}

            <form className="form-grid form-grid--compact" onSubmit={submitAppointment}>
              <label className="field">
                <span>Data</span>
                <input type="date" value={bookingForm.date} onChange={(event) => setBookingForm((current) => ({ ...current, date: event.target.value }))} required />
              </label>

              <label className="field">
                <span>Horário</span>
                <input type="time" value={bookingForm.time} onChange={(event) => setBookingForm((current) => ({ ...current, time: event.target.value }))} required />
              </label>

              <button className="button button--primary" type="submit" disabled={clientAppointments.isSubmitting}>
                {clientAppointments.isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </form>
          </section>
        ) : null}

        {(activeSection === 'agenda' || activeSection === 'historico') && (
          <section className="card">
            <div className="card__header">
              <div>
                <h2>Histórico de agendamentos</h2>
                <p>Veja o status das suas solicitações.</p>
              </div>
            </div>

            {clientAppointments.errorMessage ? <p className="feedback feedback--danger">{clientAppointments.errorMessage}</p> : null}
            {clientAppointments.isLoading ? <p className="meta-text">Carregando histórico...</p> : null}

            {!clientAppointments.isLoading && clientAppointments.appointments.length === 0 ? (
              <p className="empty-state">Nenhum agendamento encontrado.</p>
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
        )}
      </div>
    </AppLayout>
  );
}
