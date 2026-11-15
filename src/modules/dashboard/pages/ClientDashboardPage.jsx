import { useEffect, useMemo, useState } from 'react';
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
  const [detailsAppointment, setDetailsAppointment] = useState(null);
  const [cancelAppointment, setCancelAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reviewAppointment, setReviewAppointment] = useState(null);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (!detailsAppointment && !cancelAppointment && !reviewAppointment) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !appointments.isSubmitting) {
        setDetailsAppointment(null);
        setCancelAppointment(null);
        setReviewAppointment(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailsAppointment, cancelAppointment, reviewAppointment, appointments.isSubmitting]);

  const submitCancellation = async (event) => {
    event.preventDefault();
    if (!cancelReason.trim()) return;
    const cancelled = await appointments.changeAppointmentStatus(
      appointmentId(cancelAppointment),
      'CANCELADO',
      cancelReason.trim(),
    );
    if (cancelled) {
      setCancelAppointment(null);
      setCancelReason('');
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    const saved = await appointments.reviewAppointment(appointmentId(reviewAppointment), {
      nota_estrelas: Number(reviewRating),
      comentario: reviewComment.trim(),
    });
    if (saved) {
      setReviewAppointment(null);
      setReviewComment('');
    }
  };

  const clientReview = (appointment) => (appointment.avaliacoes || [])
    .find((review) => review.avaliador_tipo === 'CLIENTE');
  const providerReview = (appointment) => (appointment.avaliacoes || [])
    .find((review) => review.avaliador_tipo === 'PRESTADOR');

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
              <article className="appointment-row appointment-row--client" key={appointmentId(appointment)}>
                <div className="appointment-row__date"><span>{formatDate(appointment.data_hora_inicio)}</span><strong>{formatTime(appointment.data_hora_inicio)}</strong></div>
                <div className="appointment-row__main"><strong>{appointment.servico?.titulo || 'Serviço'}</strong><span>{appointment.prestador?.usuario?.nome_completo || 'Profissional'}</span><small>{appointment.servico?.duracao_padrao || '—'} min</small></div>
                <StatusBadge status={appointment.status} />
                <strong className="appointment-row__price">{formatCurrency(appointment.servico?.preco)}</strong>
                <div className="appointment-row__actions">
                  <button className="appointment-action" type="button" aria-label="Visualizar agendamento" onClick={() => setDetailsAppointment(appointment)}>View</button>
                  {appointment.status === 'PENDENTE' || appointment.status === 'CONFIRMADO' ? (
                    <button className="appointment-action appointment-action--danger" type="button" onClick={() => { setCancelReason(''); setCancelAppointment(appointment); }}>Cancelar</button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeSection === 'historico' ? (
        <ClientHistory
          appointments={appointments.appointments}
          isLoading={appointments.isLoading}
          onReview={(appointment) => { setReviewRating('5'); setReviewComment(''); setReviewAppointment(appointment); }}
          getClientReview={clientReview}
          getProviderReview={providerReview}
        />
      ) : null}

      {activeSection === 'perfil' ? <AccountSettingsPanel /> : null}

      {detailsAppointment ? (
        <div className="provider-completion-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailsAppointment(null); }}>
          <section className="provider-completion-dialog provider-appointment-dialog" role="dialog" aria-modal="true" aria-labelledby="client-appointment-details-title">
            <button className="appointment-dialog-close" type="button" aria-label="Fechar" onClick={() => setDetailsAppointment(null)}>×</button>
            <h2 id="client-appointment-details-title">Dados do agendamento</h2>
            <dl className="provider-appointment-details">
              <div><dt>Serviço</dt><dd>{detailsAppointment.servico?.titulo || 'Serviço'}</dd></div>
              <div><dt>Profissional</dt><dd>{detailsAppointment.prestador?.usuario?.nome_completo || 'Profissional'}</dd></div>
              <div><dt>Data e horário</dt><dd>{formatDate(detailsAppointment.data_hora_inicio)} · {formatTime(detailsAppointment.data_hora_inicio)}</dd></div>
              <div><dt>Duração</dt><dd>{detailsAppointment.servico?.duracao_padrao || '—'} min</dd></div>
              <div><dt>Valor</dt><dd>{formatCurrency(detailsAppointment.servico?.preco)}</dd></div>
              <div><dt>Status</dt><dd>{detailsAppointment.status}</dd></div>
              {detailsAppointment.status === 'CANCELADO' ? <>
                <div><dt>Motivo do cancelamento</dt><dd>{detailsAppointment.motivo_cancelamento || 'Não informado'}</dd></div>
                <div><dt>Cancelado por</dt><dd>{detailsAppointment.cancelado_por === 'CLIENTE' ? 'Cliente' : detailsAppointment.cancelado_por === 'PRESTADOR' ? 'Prestador' : 'Sistema'}</dd></div>
              </> : null}
              {providerReview(detailsAppointment) ? <div><dt>Avaliação do profissional</dt><dd>{providerReview(detailsAppointment).nota_estrelas} estrelas · {providerReview(detailsAppointment).comentario || 'Sem comentário'}</dd></div> : null}
            </dl>
          </section>
        </div>
      ) : null}

      {cancelAppointment ? (
        <div className="provider-completion-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !appointments.isSubmitting) setCancelAppointment(null); }}>
          <form className="provider-completion-dialog" role="dialog" aria-modal="true" aria-labelledby="client-cancel-title" onSubmit={submitCancellation}>
            <h2 id="client-cancel-title">Cancelar agendamento</h2>
            <p>Informe o motivo do cancelamento para <strong>{cancelAppointment.servico?.titulo || 'este serviço'}</strong>.</p>
            <label className="field"><span>Motivo do cancelamento</span><textarea required minLength={1} maxLength={1000} rows={4} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></label>
            {appointments.errorMessage ? <p className="feedback feedback--danger" role="alert">{appointments.errorMessage}</p> : null}
            <div className="provider-completion-dialog__actions">
              <button className="button button--secondary" type="button" disabled={appointments.isSubmitting} onClick={() => setCancelAppointment(null)}>Voltar</button>
              <button className="button button--danger" type="submit" disabled={appointments.isSubmitting || !cancelReason.trim()}>{appointments.isSubmitting ? 'Cancelando...' : 'Confirmar cancelamento'}</button>
            </div>
          </form>
        </div>
      ) : null}

      {reviewAppointment ? (
        <div className="provider-completion-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !appointments.isSubmitting) setReviewAppointment(null); }}>
          <form className="provider-completion-dialog" role="dialog" aria-modal="true" aria-labelledby="client-review-title" onSubmit={submitReview}>
            <h2 id="client-review-title">Avaliar profissional</h2>
            <p>{reviewAppointment.servico?.titulo || 'Serviço'} · {reviewAppointment.prestador?.usuario?.nome_completo || 'Profissional'}</p>
            <label className="field"><span>Nota</span><select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} {rating === 1 ? 'estrela' : 'estrelas'}</option>)}</select></label>
            <label className="field"><span>Comentário (opcional)</span><textarea maxLength={2000} rows={4} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} /></label>
            {appointments.errorMessage ? <p className="feedback feedback--danger" role="alert">{appointments.errorMessage}</p> : null}
            <div className="provider-completion-dialog__actions"><button className="button button--secondary" type="button" disabled={appointments.isSubmitting} onClick={() => setReviewAppointment(null)}>Voltar</button><button className="button button--primary" type="submit" disabled={appointments.isSubmitting}>{appointments.isSubmitting ? 'Enviando...' : 'Enviar avaliação'}</button></div>
          </form>
        </div>
      ) : null}
    </main>
  );
}