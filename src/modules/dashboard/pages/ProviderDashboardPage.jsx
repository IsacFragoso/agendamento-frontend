import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PROVIDER_SECTIONS, ROUTE_PATHS, getProviderPath } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { useProviderAppointments } from '../../appointments/hooks/useProviderAppointments';
import { useProviderSchedule } from '../../schedules/hooks/useProviderSchedule';
import { useProviderServices } from '../../services/hooks/useProviderServices';
import AppLayout from '../../../shared/components/layouts/AppLayout';
import AccountSettingsPanel from '../../../shared/components/AccountSettingsPanel';
import PageHeader from '../../../shared/components/ui/PageHeader';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { formatCurrency, formatDate, formatTime } from '../../../shared/utils/format';
import './dashboards.css';

const PROVIDER_MENU_ITEMS = [
  { label: 'Visão geral', icon: '⌂', to: getProviderPath('inicio') },
  { label: 'Agendamentos', icon: '▦', to: getProviderPath('agenda') },
  { label: 'Portfólio', icon: '▤', to: getProviderPath('portfolio') },
  { label: 'Histórico', icon: '↺', to: getProviderPath('historico') },
  { label: 'Configurações', icon: '⚙', to: getProviderPath('perfil') },
];

const appointmentId = (appointment) => appointment.id_agendamento || appointment.id;

export default function ProviderDashboardPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = PROVIDER_SECTIONS.includes(section) ? section : 'agenda';
  const { logout, token, user } = useAuth();
  const providerServices = useProviderServices({ providerId: user?.id, token });
  const providerSchedule = useProviderSchedule({ providerId: user?.id, token });
  const providerAppointments = useProviderAppointments({ token });
  const [appointmentFilter, setAppointmentFilter] = useState('PENDENTE');
  const [historySearch, setHistorySearch] = useState('');

  const pending = providerAppointments.appointments.filter((item) => item.status === 'PENDENTE');
  const confirmed = providerAppointments.appointments
    .filter((item) => item.status === 'CONFIRMADO')
    .sort((left, right) => new Date(left.data_hora_inicio) - new Date(right.data_hora_inicio));
  const todayKey = new Date().toLocaleDateString('en-CA');
  const todayAppointments = confirmed.filter((item) => new Date(item.data_hora_inicio).toLocaleDateString('en-CA') === todayKey);
  const filteredAppointments = appointmentFilter === 'TODOS'
    ? providerAppointments.appointments
    : providerAppointments.appointments.filter((item) => item.status === appointmentFilter);
  const historyAppointments = providerAppointments.appointments
    .filter((item) => ['CONCLUIDO', 'CANCELADO'].includes(item.status))
    .filter((item) => `${item.cliente?.nome_completo || ''} ${item.servico?.titulo || ''}`.toLowerCase().includes(historySearch.toLowerCase()));

  const stats = {
    pending: pending.length,
    confirmed: confirmed.length,
    services: providerServices.services.filter((item) => item.ativo).length,
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTE_PATHS.marketplace, { replace: true });
  };

  return (
    <AppLayout menuItems={PROVIDER_MENU_ITEMS}>
      <main className="dashboard-page">
        <PageHeader
          title={activeSection === 'inicio' ? `Olá, ${user?.nome_completo || 'Prestador'}` : ({ portfolio: 'Meu portfólio', historico: 'Histórico de atendimentos', perfil: 'Configurações', agenda: 'Agendamentos' }[activeSection])}
          subtitle={activeSection === 'inicio' ? 'Acompanhe sua rotina e mantenha seu trabalho em dia.' : ''}
          actions={<button className="button button--secondary" type="button" onClick={handleLogout}>Sair</button>}
        />

        {providerAppointments.errorMessage ? <p className="feedback feedback--danger">{providerAppointments.errorMessage}</p> : null}
        {providerAppointments.feedbackMessage ? <p className="feedback feedback--success">{providerAppointments.feedbackMessage}</p> : null}

        {activeSection === 'inicio' ? (
          <>
            <section className="dashboard-welcome dashboard-welcome--provider">
              <div>
                <span>Seu espaço de trabalho</span>
                <h2>Uma agenda organizada começa com boas respostas.</h2>
                <p>Confira o que precisa de atenção e mantenha sua disponibilidade atualizada.</p>
                <button className="button button--primary" type="button" onClick={() => navigate(getProviderPath('portfolio'))}>Gerenciar portfólio <span aria-hidden="true">→</span></button>
              </div>
              <div className="dashboard-welcome__art" aria-hidden="true"><span>✦</span><i /><b /></div>
            </section>
            <section className="dashboard-stats" aria-label="Resumo profissional">
              <article><span>Solicitações pendentes</span><strong>{stats.pending}</strong><small>Aguardando sua resposta</small></article>
              <article><span>Agendamentos confirmados</span><strong>{stats.confirmed}</strong><small>Próximos atendimentos</small></article>
              <article><span>Serviços publicados</span><strong>{stats.services}</strong><small>Visíveis para clientes</small></article>
            </section>
            <div className="dashboard-columns provider-agenda-grid">
              <section className="dashboard-panel">
                <div className="dashboard-panel__heading"><div><p className="dashboard-eyebrow">Hoje</p><h2>Agenda do dia</h2></div><span className="provider-today__date">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></div>
                {!todayAppointments.length ? <p className="dashboard-empty">Nenhum atendimento confirmado para hoje.</p> : null}
                {todayAppointments.map((appointment) => <article className="today-item" key={appointmentId(appointment)}><time>{formatTime(appointment.data_hora_inicio)}</time><div><strong>{appointment.servico?.titulo || 'Atendimento'}</strong><span>{appointment.cliente?.nome_completo || 'Cliente'}</span></div></article>)}
                <button className="provider-today__link" type="button" onClick={() => navigate(getProviderPath('agenda'))}>Abrir agenda de solicitações <span aria-hidden="true">→</span></button>
              </section>
              <section className="dashboard-panel">
                <div className="dashboard-panel__heading"><div><p className="dashboard-eyebrow">Caixa de entrada</p><h2>Solicitações pendentes</h2></div><span className="provider-pending-count">{pending.length}</span></div>
                {!pending.length ? <p className="dashboard-empty">Nenhuma solicitação aguardando resposta.</p> : null}
                {pending.slice(0, 3).map((appointment) => <article className="overview-request" key={appointmentId(appointment)}><div><strong>{appointment.cliente?.nome_completo || 'Cliente'}</strong><span>{appointment.servico?.titulo || 'Serviço'}</span><small>{formatDate(appointment.data_hora_inicio)} · {formatTime(appointment.data_hora_inicio)}</small></div><StatusBadge status={appointment.status} /></article>)}
                {pending.length > 3 ? <button className="provider-today__link" type="button" onClick={() => navigate(getProviderPath('agenda'))}>Ver mais {pending.length - 3} solicitações <span aria-hidden="true">→</span></button> : null}
              </section>
            </div>
          </>
        ) : null}

        {activeSection === 'agenda' ? (
          <>
            <section className="dashboard-stats" aria-label="Resumo profissional">
              <article><span>Solicitações pendentes</span><strong>{stats.pending}</strong><small>Aguardando sua resposta</small></article>
              <article><span>Agendamentos confirmados</span><strong>{stats.confirmed}</strong><small>Próximos atendimentos</small></article>
              <article><span>Serviços publicados</span><strong>{stats.services}</strong><small>Visíveis para clientes</small></article>
            </section>

            <div className="dashboard-columns provider-agenda-grid">
              <section className="dashboard-panel">
                <div className="dashboard-panel__heading dashboard-panel__heading--stack-mobile">
                  <div><p className="dashboard-eyebrow">Caixa de entrada</p><h2>Solicitações de agendamento</h2></div>
                  <div className="dashboard-tabs" role="group" aria-label="Filtrar solicitações">
                    {[['PENDENTE', 'Pendentes'], ['CONFIRMADO', 'Confirmados'], ['TODOS', 'Todas']].map(([value, label]) => (
                      <button className={appointmentFilter === value ? 'is-active' : ''} key={value} type="button" onClick={() => setAppointmentFilter(value)}>{label}</button>
                    ))}
                  </div>
                </div>
                {providerAppointments.isLoading ? <p className="dashboard-empty">Carregando solicitações...</p> : null}
                {!providerAppointments.isLoading && filteredAppointments.length === 0 ? (
                  <div className="dashboard-empty"><span aria-hidden="true">▦</span><p>Nenhuma solicitação nesta fila.</p></div>
                ) : null}
                <div className="provider-request-list">
                  {filteredAppointments.map((appointment) => (
                    <article className="provider-request" key={appointmentId(appointment)}>
                      <div className="provider-request__top">
                        <div className="provider-request__avatar">{appointment.cliente?.nome_completo?.slice(0, 1) || 'C'}</div>
                        <div className="provider-request__identity"><strong>{appointment.cliente?.nome_completo || 'Cliente'}</strong><span>{appointment.status === 'PENDENTE' ? 'Nova solicitação' : 'Agendamento confirmado'}</span></div>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <div className="provider-request__service">
                        <strong>{appointment.servico?.titulo || 'Serviço'}</strong>
                        <span>{formatCurrency(appointment.servico?.preco)} · {appointment.servico?.duracao_padrao || '—'} min</span>
                      </div>
                      <p className="provider-request__date">▦ {formatDate(appointment.data_hora_inicio)} às {formatTime(appointment.data_hora_inicio)}</p>
                      {appointment.status === 'PENDENTE' ? (
                        <div className="provider-request__actions">
                          <button className="button button--primary" type="button" disabled={providerAppointments.isSubmitting} onClick={() => providerAppointments.changeAppointmentStatus(appointmentId(appointment), 'CONFIRMADO')}>Aceitar proposta</button>
                          <button className="button button--secondary" type="button" disabled={providerAppointments.isSubmitting} onClick={() => providerAppointments.changeAppointmentStatus(appointmentId(appointment), 'CANCELADO')}>Recusar</button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>

              <aside className="dashboard-panel provider-today">
                <div className="dashboard-panel__heading"><div><p className="dashboard-eyebrow">Hoje</p><h2>Agenda do dia</h2></div><span className="provider-today__date">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></div>
                {!todayAppointments.length ? <p className="dashboard-empty">Nenhum atendimento confirmado para hoje.</p> : null}
                {todayAppointments.map((appointment) => (
                  <article className="today-item" key={appointmentId(appointment)}>
                    <time>{formatTime(appointment.data_hora_inicio)}</time>
                    <div><strong>{appointment.servico?.titulo || 'Atendimento'}</strong><span>{appointment.cliente?.nome_completo || 'Cliente'}</span></div>
                  </article>
                ))}
                <button className="provider-today__link" type="button" onClick={() => navigate(getProviderPath('portfolio'))}>Ajustar disponibilidade <span aria-hidden="true">→</span></button>
              </aside>
            </div>
          </>
        ) : null}

        {activeSection === 'portfolio' ? (
          <div className="provider-portfolio-layout">
            <section className="dashboard-panel provider-portfolio">
              <div className="dashboard-panel__heading"><div><p className="dashboard-eyebrow">Serviços publicados</p><h2>Seu portfólio</h2></div><span>{providerServices.services.length} serviços</span></div>
              {providerServices.errorMessage ? <p className="feedback feedback--danger">{providerServices.errorMessage}</p> : null}
              {providerServices.feedbackMessage ? <p className="feedback feedback--success">{providerServices.feedbackMessage}</p> : null}
              {providerServices.isLoading ? <p className="dashboard-empty">Carregando serviços...</p> : null}
              <div className="portfolio-table-wrap">
                <table className="portfolio-table">
                  <thead><tr><th>Serviço</th><th>Duração</th><th>Preço</th><th>Status</th><th>Ações</th></tr></thead>
                  <tbody>{providerServices.services.map((service) => (
                    <tr key={service.id_servico || service.id}>
                      <td><strong>{service.titulo}</strong><small>{service.categoria?.nome || 'Serviço'}</small></td>
                      <td>{service.duracao_padrao} min</td>
                      <td>{formatCurrency(service.preco)}</td>
                      <td><button className={`service-toggle ${service.ativo ? 'is-on' : ''}`} type="button" role="switch" aria-checked={Boolean(service.ativo)} aria-label={`${service.ativo ? 'Pausar' : 'Publicar'} ${service.titulo}`} disabled={providerServices.isSubmitting} onClick={() => providerServices.toggleService(service)}><span /></button></td>
                      <td><div className="portfolio-actions"><button type="button" onClick={() => providerServices.editService(service)}>Editar</button><button className="is-danger" type="button" onClick={() => {
                        if (window.confirm(`Arquivar o serviço "${service.titulo}"? Ele sairá da vitrine, mas seus agendamentos serão preservados.`)) {
                          void providerServices.removeService(service.id_servico || service.id);
                        }
                      }}>Arquivar</button></div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <form className="provider-service-form" onSubmit={providerServices.submitService}>
                <div className="provider-service-form__heading"><div><p className="dashboard-eyebrow">{providerServices.editingServiceId ? 'Editar oferta' : 'Nova oferta'}</p><h3>{providerServices.editingServiceId ? 'Atualizar serviço' : 'Adicionar serviço'}</h3></div></div>
                <label className="field"><span>Nome do serviço</span><input value={providerServices.formValues.titulo} onChange={(event) => providerServices.updateField('titulo', event.target.value)} required /></label>
                <label className="field"><span>Descrição</span><textarea rows="3" value={providerServices.formValues.descricao} onChange={(event) => providerServices.updateField('descricao', event.target.value)} /></label>
                <div className="form-grid">
                  <label className="field"><span>Preço (R$)</span><input type="number" min="0" step="0.01" value={providerServices.formValues.preco} onChange={(event) => providerServices.updateField('preco', event.target.value)} required /></label>
                  <label className="field"><span>Duração (min)</span><input type="number" min="1" value={providerServices.formValues.duracao_padrao} onChange={(event) => providerServices.updateField('duracao_padrao', event.target.value)} required /></label>
                </div>
                <label className="field"><span>Categoria</span><select value={providerServices.formValues.id_categoria} onChange={(event) => providerServices.updateField('id_categoria', event.target.value)} required><option value="">Selecione uma categoria</option>{providerServices.categories.map((category) => <option key={category.id_categoria} value={category.id_categoria}>{category.nome}</option>)}</select></label>
                <div className="actions-row">
                  <button className="button button--primary" type="submit" disabled={providerServices.isSubmitting}>{providerServices.isSubmitting ? 'Salvando...' : providerServices.editingServiceId ? 'Salvar alterações' : 'Adicionar serviço'}</button>
                  {providerServices.editingServiceId ? <button className="button button--secondary" type="button" onClick={providerServices.cancelEditing}>Cancelar edição</button> : null}
                </div>
              </form>
            </section>

            <section className="dashboard-panel provider-schedule-panel">
              <div className="dashboard-panel__heading"><div><p className="dashboard-eyebrow">Disponibilidade</p><h2>Horários de atendimento</h2></div></div>
              {providerSchedule.errorMessage ? <p className="feedback feedback--danger">{providerSchedule.errorMessage}</p> : null}
              {providerSchedule.feedbackMessage ? <p className="feedback feedback--success">{providerSchedule.feedbackMessage}</p> : null}
              <form className="provider-schedule-form" onSubmit={providerSchedule.submitSchedule}>
                <label className="field"><span>Dia da semana</span><select value={providerSchedule.formValues.diaSelecionado} onChange={(event) => providerSchedule.updateField('diaSelecionado', event.target.value)}>{providerSchedule.days.map((day) => <option key={day} value={day}>{day}</option>)}</select></label>
                <div className="form-grid"><label className="field"><span>Início</span><input type="time" value={providerSchedule.formValues.horaInicio} onChange={(event) => providerSchedule.updateField('horaInicio', event.target.value)} required /></label><label className="field"><span>Fim</span><input type="time" value={providerSchedule.formValues.horaFim} onChange={(event) => providerSchedule.updateField('horaFim', event.target.value)} required /></label></div>
                <button className="button button--primary" type="submit" disabled={providerSchedule.isSubmitting}>{providerSchedule.isSubmitting ? 'Salvando...' : 'Adicionar horário'}</button>
              </form>
              <div className="schedule-list">
                {providerSchedule.scheduleItems.map((item, index) => (
                  <div className="schedule-row" key={item.id_horario || item.id || `${item.dia_semana}-${index}`}>
                    <div><strong>{item.dia || item.dia_semana}</strong><span>{String(item.hora_inicio || item.horaInicio).slice(0, 5)}–{String(item.hora_fim || item.horaFim).slice(0, 5)}</span></div>
                    <button type="button" aria-label={`Remover horários de ${item.dia || item.dia_semana}`} onClick={() => providerSchedule.removeScheduleDay(item.dia_semana ?? item.dia)}>×</button>
                  </div>
                ))}
                {!providerSchedule.isLoading && !providerSchedule.scheduleItems.length ? <p className="dashboard-empty">Nenhum horário cadastrado.</p> : null}
              </div>
            </section>
          </div>
        ) : null}

        {activeSection === 'historico' ? (
          <section className="dashboard-panel">
            <div className="dashboard-panel__heading dashboard-panel__heading--stack-mobile"><div><p className="dashboard-eyebrow">Registros</p><h2>Atendimentos anteriores</h2></div><label className="dashboard-search"><span aria-hidden="true">⌕</span><input aria-label="Buscar no histórico" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Buscar cliente ou serviço" /></label></div>
            <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Cliente</th><th>Serviço</th><th>Data e hora</th><th>Valor</th><th>Status</th></tr></thead><tbody>{historyAppointments.map((appointment) => <tr key={appointmentId(appointment)}><td>{appointment.cliente?.nome_completo || 'Cliente'}</td><td>{appointment.servico?.titulo || 'Serviço'}</td><td>{formatDate(appointment.data_hora_inicio)} · {formatTime(appointment.data_hora_inicio)}</td><td>{formatCurrency(appointment.servico?.preco)}</td><td><StatusBadge status={appointment.status} /></td></tr>)}</tbody></table>{!providerAppointments.isLoading && !historyAppointments.length ? <p className="dashboard-empty">Nenhum atendimento anterior encontrado.</p> : null}</div>
          </section>
        ) : null}

        {activeSection === 'perfil' ? <AccountSettingsPanel /> : null}
      </main>
    </AppLayout>
  );
}