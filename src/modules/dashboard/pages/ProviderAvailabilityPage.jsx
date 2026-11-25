import { CalendarDays, Clock3, Sunrise, Sun, Zap, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../../core/store/use-auth';
import PageHeader from '../../../shared/components/ui/PageHeader';
import { useProviderSchedule } from '../../schedules/hooks/useProviderSchedule';
import './dashboards.css';

const WEEKDAYS_BY_NUMBER = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const getDayName = (schedule) => {
  const dayNumber = Number(schedule.dia_semana);
  if (Number.isInteger(dayNumber) && dayNumber >= 0 && dayNumber <= 6) {
    return WEEKDAYS_BY_NUMBER[dayNumber];
  }
  return schedule.dia || 'Dia não informado';
};

const formatScheduleTime = (time) => String(time || '').slice(0, 5) || '--:--';

export default function ProviderAvailabilityPage({ embedded = false }) {
  const { token, user } = useAuth();
  const availability = useProviderSchedule({ providerId: user?.id, token });

  const setPreset = (start, end) => {
    availability.updateField('horaInicio', start);
    availability.updateField('horaFim', end);
  };

  const removeSchedule = async (schedule) => {
    if (!window.confirm(`Remover a disponibilidade de ${getDayName(schedule)} das ${formatScheduleTime(schedule.hora_inicio)} às ${formatScheduleTime(schedule.hora_fim)}?`)) {
      return;
    }

    await availability.removeScheduleInterval(schedule.id_horario);
  };

  return (
    <main className={embedded ? 'portfolio-schedule-embedded' : 'dashboard-page'}>
      {!embedded ? (
        <PageHeader
          title="Disponibilidade"
          subtitle="Defina os dias e horários em que seus clientes podem solicitar atendimentos."
        />
      ) : null}

      {availability.errorMessage ? <p className="feedback feedback--danger" role="alert">{availability.errorMessage}</p> : null}
      {availability.feedbackMessage ? <p className="feedback feedback--success" role="status">{availability.feedbackMessage}</p> : null}

      <div className="provider-availability-layout">
        <section className="dashboard-panel schedule-inline-panel" aria-labelledby="availability-form-title">
          <div className="dashboard-panel__heading">
            <div>
              <p className="dashboard-eyebrow">Agenda semanal</p>
              <h2 id="availability-form-title">
                {availability.editingScheduleId ? 'Editar horário' : 'Adicionar horário'}
              </h2>
            </div>
          </div>

          <form className="schedule-inline-form" onSubmit={availability.submitSchedule}>
            <section className="schedule-inline-section">
              <h3><CalendarDays size={18} aria-hidden="true" /> Dia da semana</h3>
              <div className="schedule-day-options">
                {availability.days.map((day) => (
                  <button
                    key={day.value}
                    className={availability.formValues.diaSelecionado === day.value ? 'is-selected' : ''}
                    type="button"
                    onClick={() => availability.updateField('diaSelecionado', day.value)}
                    disabled={availability.isSubmitting}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="schedule-inline-section">
              <h3><Clock3 size={18} aria-hidden="true" /> Horário de atendimento</h3>
              <div className="schedule-time-grid">
                <label className="field">
                  <span>Início</span>
                  <input
                    type="time"
                    required
                    value={availability.formValues.horaInicio}
                    onChange={(event) => availability.updateField('horaInicio', event.target.value)}
                    disabled={availability.isSubmitting}
                  />
                </label>
                <label className="field">
                  <span>Encerramento</span>
                  <input
                    type="time"
                    required
                    min={availability.formValues.horaInicio}
                    value={availability.formValues.horaFim}
                    onChange={(event) => availability.updateField('horaFim', event.target.value)}
                    disabled={availability.isSubmitting}
                  />
                </label>
                <div className="schedule-presets">
                  <span><Zap size={15} aria-hidden="true" /> Preenchimento rápido</span>
                  <div>
                    <button type="button" onClick={() => setPreset('06:00', '12:00')} disabled={availability.isSubmitting}><Sunrise size={15} /> Manhã</button>
                    <button type="button" onClick={() => setPreset('12:00', '18:00')} disabled={availability.isSubmitting}><Sun size={15} /> Tarde</button>
                    <button type="button" onClick={() => setPreset('08:00', '18:00')} disabled={availability.isSubmitting}><CalendarDays size={15} /> Dia inteiro</button>
                  </div>
                </div>
              </div>
            </section>

            <div className="schedule-inline-actions">
              {availability.editingScheduleId ? (
                <button className="button button--secondary" type="button" onClick={availability.cancelEditing} disabled={availability.isSubmitting}>Cancelar edição</button>
              ) : null}
              <button className="button button--primary" type="submit" disabled={availability.isSubmitting}>
                {availability.isSubmitting
                  ? 'Salvando...'
                  : availability.editingScheduleId ? 'Salvar alterações' : 'Adicionar horário'}
              </button>
            </div>
          </form>
        </section>

        <section className="dashboard-panel" aria-labelledby="availability-list-title">
          <div className="dashboard-panel__heading">
            <div>
              <p className="dashboard-eyebrow">Visível aos clientes</p>
              <h2 id="availability-list-title">Horários cadastrados</h2>
            </div>
          </div>

          {availability.isLoading ? <p className="dashboard-empty" role="status">Carregando disponibilidade...</p> : null}
          {!availability.isLoading && !availability.errorMessage && !availability.scheduleItems.length ? (
            <p className="dashboard-empty">Nenhum horário cadastrado. Adicione os dias e intervalos em que atende.</p>
          ) : null}
          {!availability.isLoading && availability.scheduleItems.length ? (
            <div className="schedule-list">
              {availability.scheduleItems.map((schedule) => (
                <article className="schedule-row" key={schedule.id_horario}>
                  <div className="schedule-row__main">
                    <strong>{getDayName(schedule)}</strong>
                    <span>{formatScheduleTime(schedule.hora_inicio)}–{formatScheduleTime(schedule.hora_fim)}</span>
                  </div>
                  <div className="schedule-row__actions">
                    <button
                      type="button"
                      aria-label={`Editar ${getDayName(schedule)} das ${formatScheduleTime(schedule.hora_inicio)} às ${formatScheduleTime(schedule.hora_fim)}`}
                      onClick={() => availability.editScheduleInterval(schedule)}
                      disabled={availability.isSubmitting}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remover ${getDayName(schedule)} das ${formatScheduleTime(schedule.hora_inicio)} às ${formatScheduleTime(schedule.hora_fim)}`}
                      onClick={() => void removeSchedule(schedule)}
                      disabled={availability.isSubmitting}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>

    </main>
  );
}
