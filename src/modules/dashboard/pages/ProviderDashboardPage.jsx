import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PROVIDER_SECTIONS, getProviderPath } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { useProviderAppointments } from '../../appointments/hooks/useProviderAppointments';
import { useProviderSchedule } from '../../schedules/hooks/useProviderSchedule';
import { useProviderServices } from '../../services/hooks/useProviderServices';
import PageHeader from '../../../shared/components/ui/PageHeader';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { formatCurrency, formatDate, formatTime } from '../../../shared/utils/format';

export default function ProviderDashboardPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = PROVIDER_SECTIONS.includes(section) ? section : 'agenda';
  const { token, user } = useAuth();
  const providerServices = useProviderServices({ providerId: user?.id, token });
  const providerSchedule = useProviderSchedule({ providerId: user?.id, token });
  const providerAppointments = useProviderAppointments({ token });

  useEffect(() => {
    if (!PROVIDER_SECTIONS.includes(section)) {
      navigate(getProviderPath(), { replace: true });
    }
  }, [navigate, section]);

  const stats = useMemo(() => ({
    confirmed: providerAppointments.appointments.filter((item) => item.status === 'CONFIRMADO').length,
    pending: providerAppointments.appointments.filter((item) => item.status === 'PENDENTE').length,
    services: providerServices.services.length,
  }), [providerAppointments.appointments, providerServices.services.length]);

  return (
      <div className="page-stack">
        <PageHeader
          title={`Olá, ${user?.nome_completo || 'Prestador'}`}
          subtitle="Gerencie seu portfólio, agenda de atendimento e solicitações recebidas."
        />

        <section className="stats-grid">
          <article className="stat-card">
            <span>Agendamentos confirmados</span>
            <strong>{stats.confirmed}</strong>
          </article>
          <article className="stat-card">
            <span>Solicitações pendentes</span>
            <strong>{stats.pending}</strong>
          </article>
          <article className="stat-card">
            <span>Serviços ativos</span>
            <strong>{stats.services}</strong>
          </article>
        </section>

        {(activeSection === 'agenda' || activeSection === 'historico') && (
          <section className="card">
            <div className="card__header">
              <div>
                <h2>Solicitações e próximos agendamentos</h2>
                <p>Acompanhe as solicitações recebidas e atualize seus status.</p>
              </div>
            </div>

            {providerAppointments.feedbackMessage ? <p className="feedback feedback--success">{providerAppointments.feedbackMessage}</p> : null}
            {providerAppointments.errorMessage ? <p className="feedback feedback--danger">{providerAppointments.errorMessage}</p> : null}
            {providerAppointments.isLoading ? <p className="meta-text">Carregando agendamentos...</p> : null}

            {!providerAppointments.isLoading && !providerAppointments.errorMessage && providerAppointments.appointments.length === 0 ? (
              <p className="empty-state">Nenhuma solicitação de agendamento recebida.</p>
            ) : null}

            <div className="service-grid">
              {providerAppointments.appointments.map((appointment) => (
                <article className="service-option" key={appointment.id_agendamento || appointment.id}>
                  <div className="service-option__header">
                    <div>
                      <strong>{appointment.cliente?.nome_completo || 'Cliente'}</strong>
                      <p>{appointment.servico?.titulo || 'Serviço não informado'}</p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>

                  <p className="meta-text">{formatDate(appointment.data_hora_inicio)} às {formatTime(appointment.data_hora_inicio)}</p>
                  <p className="meta-text">Valor: {formatCurrency(appointment.servico?.preco)}</p>

                  {appointment.status === 'PENDENTE' ? (
                    <div className="actions-row">
                      <button
                        className="button button--primary"
                        type="button"
                        disabled={providerAppointments.isSubmitting}
                        onClick={() => providerAppointments.changeAppointmentStatus(appointment.id_agendamento || appointment.id, 'CONFIRMADO')}
                      >
                        Confirmar
                      </button>
                      <button
                        className="button button--danger"
                        type="button"
                        disabled={providerAppointments.isSubmitting}
                        onClick={() => providerAppointments.changeAppointmentStatus(appointment.id_agendamento || appointment.id, 'CANCELADO')}
                      >
                        Recusar
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        )}

        {(activeSection === 'agenda' || activeSection === 'perfil') && (
          <section className="section-grid provider-schedule-grid">
            <article className="card">
              <div className="card__header">
                <div>
                  <h2>Dias de atendimento</h2>
                  <p>Configure os horários que ficarão disponíveis para agendamento.</p>
                </div>
              </div>

              {providerSchedule.feedbackMessage ? <p className="feedback feedback--success">{providerSchedule.feedbackMessage}</p> : null}
              {providerSchedule.errorMessage ? <p className="feedback feedback--danger">{providerSchedule.errorMessage}</p> : null}

              <form className="form-stack" onSubmit={providerSchedule.submitSchedule}>
                <label className="field">
                  <span>Dia da semana</span>
                  <select value={providerSchedule.formValues.diaSelecionado} onChange={(event) => providerSchedule.updateField('diaSelecionado', event.target.value)}>
                    {providerSchedule.days.map((day) => <option key={day} value={day}>{day}</option>)}
                  </select>
                </label>

                <div className="form-grid">
                  <label className="field">
                    <span>Início</span>
                    <input type="time" value={providerSchedule.formValues.horaInicio} onChange={(event) => providerSchedule.updateField('horaInicio', event.target.value)} required />
                  </label>

                  <label className="field">
                    <span>Fim</span>
                    <input type="time" value={providerSchedule.formValues.horaFim} onChange={(event) => providerSchedule.updateField('horaFim', event.target.value)} required />
                  </label>
                </div>

                <button className="button button--primary" type="submit" disabled={providerSchedule.isSubmitting}>
                  {providerSchedule.isSubmitting ? 'Salvando...' : 'Salvar dia'}
                </button>
              </form>

              {providerSchedule.isLoading ? <p className="meta-text">Carregando agenda...</p> : null}

              <div className="list-stack">
                {providerSchedule.scheduleItems.map((scheduleItem, index) => (
                  <div className="list-row" key={scheduleItem.id || `${scheduleItem.dia}-${index}`}>
                    <div>
                      <strong>{scheduleItem.dia || scheduleItem.dia_semana}</strong>
                      <p>{formatTime(scheduleItem.horaInicio || scheduleItem.hora_inicio)} às {formatTime(scheduleItem.horaFim || scheduleItem.hora_fim)}</p>
                    </div>
                    <button className="button button--ghost-danger" type="button" onClick={() => providerSchedule.removeScheduleDay(scheduleItem.dia || scheduleItem.dia_semana)}>
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}
      </div>
  );
}
