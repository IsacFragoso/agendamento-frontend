import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTE_PATHS, PROVIDER_SECTIONS, getProviderPath } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { useProviderAppointments } from '../../appointments/hooks/useProviderAppointments';
import { useProviderSchedule } from '../../schedules/hooks/useProviderSchedule';
import { useProviderServices } from '../../services/hooks/useProviderServices';
import AppLayout from '../../../shared/components/layouts/AppLayout';
import PageHeader from '../../../shared/components/ui/PageHeader';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { formatCurrency, formatDate, formatTime } from '../../../shared/utils/format';

const PROVIDER_MENU_ITEMS = [
  { label: 'Agenda', icon: '📅', to: getProviderPath('agenda') },
  { label: 'Histórico', icon: '🕒', to: getProviderPath('historico') },
  { label: 'Perfil', icon: '👤', to: getProviderPath('perfil') },
];

export default function ProviderDashboardPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = PROVIDER_SECTIONS.includes(section) ? section : 'agenda';
  const { logout, token, user } = useAuth();
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

  const handleLogout = () => {
    logout();
    navigate(ROUTE_PATHS.login, { replace: true });
  };

  return (
    <AppLayout menuItems={PROVIDER_MENU_ITEMS}>
      <div className="page-stack">
        <PageHeader
          title={`Olá, ${user?.nome_completo || 'Prestador'}`}
          subtitle="Gerencie seu portfólio, agenda de atendimento e solicitações recebidas."
          actions={(
            <button className="button button--secondary" type="button" onClick={handleLogout}>
              Sair
            </button>
          )}
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

            {!providerAppointments.isLoading && providerAppointments.appointments.length === 0 ? (
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
          <section className="section-grid section-grid--two">
            <article className="card">
              <div className="card__header">
                <div>
                  <h2>Meu portfólio</h2>
                  <p>Cadastre, visualize e remova os serviços publicados.</p>
                </div>
              </div>

              {providerServices.feedbackMessage ? <p className="feedback feedback--success">{providerServices.feedbackMessage}</p> : null}
              {providerServices.errorMessage ? <p className="feedback feedback--danger">{providerServices.errorMessage}</p> : null}

              <form className="form-stack" onSubmit={providerServices.submitService}>
                <label className="field">
                  <span>Título do serviço</span>
                  <input value={providerServices.formValues.titulo} onChange={(event) => providerServices.updateField('titulo', event.target.value)} required />
                </label>

                <label className="field">
                  <span>Descrição</span>
                  <textarea value={providerServices.formValues.descricao} onChange={(event) => providerServices.updateField('descricao', event.target.value)} rows="3" required />
                </label>

                <div className="form-grid">
                  <label className="field">
                    <span>Preço</span>
                    <input type="number" min="0" step="0.01" value={providerServices.formValues.preco} onChange={(event) => providerServices.updateField('preco', event.target.value)} required />
                  </label>

                  <label className="field">
                    <span>Duração (min)</span>
                    <input type="number" min="1" value={providerServices.formValues.duracao_padrao} onChange={(event) => providerServices.updateField('duracao_padrao', event.target.value)} required />
                  </label>
                </div>

                <label className="field">
                  <span>Categoria</span>
                  <select value={providerServices.formValues.id_categoria} onChange={(event) => providerServices.updateField('id_categoria', event.target.value)} required>
                    <option value="">Selecione uma categoria</option>
                    {providerServices.categories.map((category) => (
                      <option key={category.id_categoria} value={category.id_categoria}>{category.nome}</option>
                    ))}
                  </select>
                </label>

                <button className="button button--primary" type="submit" disabled={providerServices.isSubmitting}>
                  {providerServices.isSubmitting ? 'Salvando...' : 'Adicionar serviço'}
                </button>
              </form>

              {providerServices.isLoading ? <p className="meta-text">Carregando serviços...</p> : null}

              <div className="list-stack">
                {providerServices.services.map((service) => (
                  <div className="list-row" key={service.id_servico || service.id}>
                    <div>
                      <strong>{service.titulo}</strong>
                      <p>{formatCurrency(service.preco)} · {service.duracao_padrao} min</p>
                    </div>
                    <button className="button button--ghost-danger" type="button" onClick={() => providerServices.removeService(service.id_servico || service.id)}>
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            </article>

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
    </AppLayout>
  );
}
