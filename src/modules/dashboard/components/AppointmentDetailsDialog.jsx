import { BriefcaseBusiness, CalendarDays, Clock3, Star, Timer, X } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../../../shared/utils/format';
import './AppointmentDetailsDialog.css';

const getInitials = (name) => {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || '—';
};

export default function AppointmentDetailsDialog({ appointment, onClose }) {
  if (!appointment) return null;

  const clientName = appointment.cliente?.nome_completo || 'Cliente';
  const providerName = appointment.prestador?.usuario?.nome_completo || 'Profissional';
  const reviews = appointment.avaliacoes || [];
  const clientReview = reviews.find((review) => review.avaliador_tipo === 'CLIENTE');
  const providerReview = reviews.find((review) => review.avaliador_tipo === 'PRESTADOR');
  const cancellationResponsible = appointment.cancelado_por === 'CLIENTE'
    ? 'Cliente'
    : appointment.cancelado_por === 'PRESTADOR'
      ? 'Prestador'
      : appointment.cancelado_por === 'SISTEMA'
        ? 'Sistema'
        : 'Responsável não informado';

  return (
    <div
      className="appointment-details-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="appointment-details-dialog" role="dialog" aria-modal="true" aria-labelledby="appointment-details-title">
        <header className="appointment-details-header">
          <div>
            <h2 id="appointment-details-title">Detalhes do atendimento</h2>
            <p>Informações e avaliações do agendamento</p>
          </div>
          <button className="appointment-details-close" type="button" aria-label="Fechar" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="appointment-details-body">
          <section className="appointment-details-service">
            <div className="appointment-details-service__icon" aria-hidden="true">
              <BriefcaseBusiness size={21} />
            </div>
            <div>
              <span>Serviço</span>
              <strong>{appointment.servico?.titulo || 'Atendimento'}</strong>
            </div>
            <div className="appointment-details-service__price">
              <span>Valor do serviço</span>
              <strong>{formatCurrency(appointment.servico?.preco)}</strong>
            </div>
          </section>

          <section className="appointment-details-section">
            <h3>Agendamento</h3>
            <div className="appointment-details-facts">
              <article>
                <CalendarDays size={16} aria-hidden="true" />
                <div><span>Data</span><strong>{formatDate(appointment.data_hora_inicio)}</strong></div>
              </article>
              <article>
                <Clock3 size={16} aria-hidden="true" />
                <div><span>Horário</span><strong>{formatTime(appointment.data_hora_inicio)}</strong></div>
              </article>
              <article>
                <Timer size={16} aria-hidden="true" />
                <div><span>Duração</span><strong>{appointment.servico?.duracao_padrao || '—'} min</strong></div>
              </article>
            </div>
          </section>

          <section className="appointment-details-section">
            <h3>Participantes</h3>
            <div className="appointment-details-participants">
              <article>
                <span className="appointment-details-avatar">{getInitials(clientName)}</span>
                <div><span>Cliente</span><strong>{clientName}</strong></div>
              </article>
              <article>
                <span className="appointment-details-avatar">{getInitials(providerName)}</span>
                <div><span>Profissional</span><strong>{providerName}</strong></div>
              </article>
            </div>
          </section>

          {appointment.status === 'CANCELADO' ? (
            <section className="appointment-details-section">
              <h3>Cancelamento</h3>
              <div className="appointment-details-cancellation">
                <p><span>Motivo</span><strong>{appointment.motivo_cancelamento || 'Não informado'}</strong></p>
                <p><span>Cancelado por</span><strong>{cancellationResponsible}</strong></p>
              </div>
            </section>
          ) : null}

          {clientReview || providerReview ? (
            <section className="appointment-details-section">
              <h3>Avaliações do atendimento</h3>
              {clientReview ? (
                <article className="appointment-details-review">
                  <strong>Cliente sobre o serviço</strong>
                  <div className="appointment-details-review__rating">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star key={rating} size={16} fill={rating <= clientReview.nota_estrelas ? 'currentColor' : 'none'} aria-label={`${rating <= clientReview.nota_estrelas ? 'Estrela preenchida' : 'Estrela vazia'}`} />
                    ))}
                    <span>{clientReview.nota_estrelas}/5</span>
                  </div>
                  <p>{clientReview.comentario || 'Sem comentário'}</p>
                </article>
              ) : null}
              {providerReview ? (
                <article className="appointment-details-review">
                  <strong>Profissional sobre o cliente</strong>
                  <div className="appointment-details-review__rating">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star key={rating} size={16} fill={rating <= providerReview.nota_estrelas ? 'currentColor' : 'none'} aria-label={`${rating <= providerReview.nota_estrelas ? 'Estrela preenchida' : 'Estrela vazia'}`} />
                    ))}
                    <span>{providerReview.nota_estrelas}/5</span>
                  </div>
                  <p>{providerReview.comentario || 'Sem comentário'}</p>
                </article>
              ) : null}
            </section>
          ) : null}
        </div>

        <footer className="appointment-details-footer">
          {appointment.data_criacao ? (
            <span>Solicitado em {formatDate(appointment.data_criacao)} às {formatTime(appointment.data_criacao)}</span>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
