import { Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../../core/store/use-auth';
import PageHeader from '../../../shared/components/ui/PageHeader';
import { useProviderSchedule } from '../../schedules/hooks/useProviderSchedule';
import './dashboards.css';

const WEEKDAYS_BY_NUMBER = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const getDayName = (schedule) => (
  WEEKDAYS_BY_NUMBER[Number(schedule.dia_semana)] || schedule.dia || 'Dia não informado'
);

export default function ProviderAvailabilityPage() {
  const { token, user } = useAuth();
  const availability = useProviderSchedule({ providerId: user?.id, token });

  const removeSchedule = async (schedule) => {
    if (!window.confirm(`Remover a disponibilidade de ${getDayName(schedule)} das ${schedule.hora_inicio.slice(0, 5)} às ${schedule.hora_fim.slice(0, 5)}?`)) {
      return;
    }

    await availability.removeScheduleInterval(schedule.id_horario);
  };

  return (
    <main className="dashboard-page">
      <PageHeader
        title="Disponibilidade"
        subtitle="Defina os dias e horários em que seus clientes podem solicitar atendimentos."
      />

      {availability.errorMessage ? <p className="feedback feedback--danger" role="alert">{availability.errorMessage}</p> : null}
      {availability.feedbackMessage ? <p className="feedback feedback--success" role="status">{availability.feedbackMessage}</p> : null}

      <div className="provider-availability-layout">
        <section className="dashboard-panel" aria-labelledby="availability-form-title">
          <div className="dashboard-panel__heading">
            <div>
              <p className="dashboard-eyebrow">Agenda semanal</p>
              <h2 id="availability-form-title">
                {availability.editingScheduleId ? 'Editar intervalo' : 'Adicionar horário'}
              </h2>
            </div>
          </div>

          <form className="provider-schedule-form" onSubmit={availability.submitSchedule}>
            <div className="provider-schedule-form__grid">
              <label className="field">
                <span>Dia da semana</span>
                <select
                  required
                  value={availability.formValues.diaSelecionado}
                  onChange={(event) => availability.updateField('diaSelecionado', event.target.value)}
                  disabled={availability.isSubmitting}
                >
                  {availability.days.map((day) => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </label>
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
            </div>

            <div className="provider-schedule-form__actions">
              <button className="button button--primary" type="submit" disabled={availability.isSubmitting}>
                {availability.isSubmitting
                  ? 'Salvando...'
                  : availability.editingScheduleId ? 'Salvar alterações' : 'Adicionar horário'}
              </button>
              {availability.editingScheduleId ? (
                <button className="button button--secondary" type="button" onClick={availability.cancelEditing} disabled={availability.isSubmitting}>
                  Cancelar edição
                </button>
              ) : null}
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
                  <div>
                    <strong>{getDayName(schedule)}</strong>
                    <span>{schedule.hora_inicio.slice(0, 5)}–{schedule.hora_fim.slice(0, 5)}</span>
                  </div>
                  <div className="schedule-row__actions">
                    <button
                      type="button"
                      aria-label={`Editar ${getDayName(schedule)} das ${schedule.hora_inicio.slice(0, 5)} às ${schedule.hora_fim.slice(0, 5)}`}
                      onClick={() => availability.editScheduleInterval(schedule)}
                      disabled={availability.isSubmitting}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remover ${getDayName(schedule)} das ${schedule.hora_inicio.slice(0, 5)} às ${schedule.hora_fim.slice(0, 5)}`}
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
