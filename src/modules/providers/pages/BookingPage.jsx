import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '../../../core/http/http-error';
import { ROUTE_PATHS, getClientPath, getDashboardPathForAccountType, getProviderProfilePath } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { createAppointment } from '../../appointments/services/appointments.service';
import {
  getProviderAvailability,
  getPublicProvider,
  listProviderSchedule,
} from '../services/providers.service';
import './marketplace.css';

const MAX_MONTHS_AHEAD = 5;

const asDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function BookingPage() {
  const { providerId, serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token, user } = useAuth();
  const isOwnProfile = isAuthenticated && String(user?.id) === String(providerId);
  const [provider, setProvider] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [availability, setAvailability] = useState({ key: '', slots: [], all: [], error: '' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [takenTimes, setTakenTimes] = useState({});
  const [viewMonth, setViewMonth] = useState(null);
  const [stage, setStage] = useState('date');
  const [booked, setBooked] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([getPublicProvider(providerId), listProviderSchedule(providerId)])
      .then(([profile, hours]) => {
        if (!isCurrent) return;
        setProvider(profile);
        setSchedule(Array.isArray(hours) ? hours : []);
      })
      .catch((error) => {
        if (isCurrent) setErrorMessage(getErrorMessage(error, 'Não foi possível carregar os horários.'));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [providerId]);

  const service = provider?.servicos?.find((item) => String(item.id_servico) === String(serviceId));
  const scheduledDays = useMemo(() => new Set(schedule.map((item) => Number(item.dia_semana))), [schedule]);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const firstAvailable = useMemo(() => {
    if (!scheduledDays.size) return null;
    for (let offset = 0; offset < 366; offset += 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
      if (scheduledDays.has(date.getDay())) return date;
    }
    return null;
  }, [scheduledDays, today]);
  const activeDate = selectedDate || (firstAvailable ? asDateKey(firstAvailable) : '');
  const baseMonth = activeDate ? new Date(`${activeDate}T12:00:00`) : today;
  const shownMonth = viewMonth || new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1);
  const monthOffset = (shownMonth.getFullYear() - today.getFullYear()) * 12 + shownMonth.getMonth() - today.getMonth();
  const daysInMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: shownMonth.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(shownMonth.getFullYear(), shownMonth.getMonth(), index + 1)),
  ];
  const availabilityKey = `${activeDate}:${serviceId}`;
  const takenForDate = takenTimes[availabilityKey] || [];
  const timeOptions = (availability.key === availabilityKey ? availability.slots : []).filter((time) => !takenForDate.includes(time));
  const allTimes = [...new Set([...(availability.key === availabilityKey ? availability.all : []), ...takenForDate])].sort();
  const activeTime = timeOptions.includes(selectedTime) ? selectedTime : '';

  useEffect(() => {
    if (!activeDate || !service) return undefined;
    let isCurrent = true;

    getProviderAvailability(providerId, serviceId, activeDate)
      .then((slots) => {
        if (isCurrent) {
          const list = (Array.isArray(slots) ? slots : []).map((slot) => (typeof slot === 'string' ? { hora: slot, disponivel: true } : slot));
          setAvailability({
            key: availabilityKey,
            slots: list.filter((slot) => slot.disponivel).map((slot) => slot.hora),
            all: list.map((slot) => slot.hora).sort(),
            error: '',
          });
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setAvailability({
            key: availabilityKey,
            slots: [],
            all: [],
            error: getErrorMessage(error, 'Não foi possível consultar a disponibilidade.'),
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [activeDate, availabilityKey, providerId, refreshKey, service, serviceId]);

  const requestBooking = async () => {
    if (!isAuthenticated) {
      navigate(ROUTE_PATHS.login, { state: { from: `${location.pathname}${location.search}` } });
      return;
    }

    const accountType = String(user?.tipo_conta).toUpperCase();
    if (!['CLIENTE', 'PRESTADOR'].includes(accountType)) {
      setErrorMessage('Entre com uma conta de cliente ou profissional para solicitar um horário.');
      return;
    }

    if (isOwnProfile) {
      setErrorMessage('Você não pode solicitar um horário para si mesmo.');
      return;
    }

    if (!service || !activeDate || !activeTime) {
      setErrorMessage('Escolha uma data e um horário para continuar.');
      return;
    }

    const start = new Date(`${activeDate}T${activeTime}:00`);
    const end = new Date(start.getTime() + Number(service.duracao_padrao) * 60_000);
    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      await createAppointment({
        id_servico: Number(service.id_servico),
        data_hora_inicio: start.toISOString(),
        data_hora_fim: end.toISOString(),
      }, token);
      setFeedbackMessage('Solicitação enviada. O profissional precisa confirmar o horário.');
      setBooked({ date: activeDate, time: activeTime });
      setStage('done');
      setTakenTimes((current) => ({ ...current, [availabilityKey]: [...(current[availabilityKey] || []), activeTime] }));
      setSelectedTime('');
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setStage('date');
      if (error?.status === 409) {
        setTakenTimes((current) => ({ ...current, [availabilityKey]: [...(current[availabilityKey] || []), activeTime] }));
        setErrorMessage('Esse horário acabou de ser reservado. Escolha outro horário disponível.');
      } else {
        setErrorMessage(getErrorMessage(error, 'Não foi possível solicitar este horário.'));
      }
      setSelectedTime('');
      setRefreshKey((current) => current + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated && !['CLIENTE', 'PRESTADOR'].includes(String(user?.tipo_conta).toUpperCase())) {
    return (
      <section className="booking-message">
          <h1>Agendamento indisponível</h1>
          <p>Esta conta não pode solicitar um horário.</p>
          <Link className="button button--primary" to={getDashboardPathForAccountType(user?.tipo_conta)}>Ir para meu painel</Link>
      </section>
    );
  }

  if (isOwnProfile) {
    return (
      <section className="booking-message">
          <h1>Este é o seu perfil</h1>
          <p>Você não pode solicitar um horário para si mesmo.</p>
          <Link className="button button--primary" to={getDashboardPathForAccountType(user?.tipo_conta)}>Ir para meu painel</Link>
      </section>
    );
  }

  return (
    <main className="booking-page">
        {isLoading ? <p className="marketplace-state">Carregando disponibilidade...</p> : null}
        {errorMessage && !service ? <p className="feedback feedback--danger">{errorMessage}</p> : null}
        {!isLoading && provider && !service ? <p className="feedback feedback--danger">Este serviço não está mais disponível.</p> : null}

        {service ? (
          <>
            <ol className="booking-flow" aria-label="Etapas do agendamento">
              {[
                { label: 'Escolha o serviço', state: 'done' },
                { label: 'Escolha a data e o horário', state: stage === 'date' ? 'current' : 'done' },
                { label: 'Confirme a solicitação', state: stage === 'date' ? 'todo' : stage === 'confirm' ? 'current' : 'done' },
              ].map((step, index) => (
                <li className={`booking-flow__step is-${step.state}`} key={step.label} aria-current={step.state === 'current' ? 'step' : undefined}>
                  <span>{step.state === 'done' ? '✓' : index + 1}</span>
                  {step.label}
                </li>
              ))}
            </ol>

            <header className="booking-heading">
              <p className="marketplace-kicker">Solicitar agendamento</p>
              <h1>{stage === 'date' ? 'Escolha uma data e um horário.' : stage === 'confirm' ? 'Confirme sua solicitação.' : 'Solicitação enviada.'}</h1>
              <p>A solicitação só fica confirmada depois da resposta do profissional.</p>
            </header>

            {stage === 'date' ? (
            <div className="booking-layout">
              <section className="booking-selector">
                <div className="booking-step"><span>1</span><div><strong>Data</strong>                <small>Dias com atendimento estão destacados</small></div></div>
                                {firstAvailable ? (
                                  <div className="booking-calendar">
                                    <div className="booking-calendar__nav">
                                      <button type="button" aria-label="Mês anterior" disabled={monthOffset <= 0} onClick={() => setViewMonth(new Date(shownMonth.getFullYear(), shownMonth.getMonth() - 1, 1))}>‹</button>
                                      <strong>{shownMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
                                      <button type="button" aria-label="Próximo mês" disabled={monthOffset >= MAX_MONTHS_AHEAD} onClick={() => setViewMonth(new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 1))}>›</button>
                                    </div>
                                    <div className="booking-calendar__grid">
                                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((label, index) => <small key={`${label}-${index}`}>{label}</small>)}
                                      {calendarCells.map((date, index) => {
                                        if (!date) return <span key={`empty-${index}`} />;
                                        const key = asDateKey(date);
                                        const isAvailable = date >= today && scheduledDays.has(date.getDay());
                                        const classes = [isAvailable ? 'is-available' : '', activeDate === key ? 'is-selected' : ''].filter(Boolean).join(' ');
                                        return (
                                          <button className={classes} key={key} type="button" disabled={!isAvailable} onClick={() => { setSelectedDate(key); setSelectedTime(''); setErrorMessage(''); setFeedbackMessage(''); }}>
                                            {date.getDate()}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                  <p className="booking-empty">Este profissional ainda não publicou horários para as próximas semanas.</p>
                )}

                <div className="booking-step booking-step--time"><span>2</span><div><strong>Horários disponíveis</strong><small>{activeDate ? new Date(`${activeDate}T12:00:00`).toLocaleDateString('pt-BR', { dateStyle: 'long' }) : 'Selecione uma data'}</small></div></div>
                {allTimes.length ? (
                  <div className="booking-time-grid">
                    {allTimes.map((time) => (
                      <button className={activeTime === time ? 'is-selected' : ''} key={time} type="button" disabled={!timeOptions.includes(time)} title={timeOptions.includes(time) ? undefined : 'Horário indisponível'} onClick={() => { setSelectedTime(time); setErrorMessage(''); setFeedbackMessage(''); }}>
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="booking-empty">
                    {availability.error || (availability.key !== availabilityKey ? 'Consultando disponibilidade...' : 'Não há horários para esta data.')}
                  </p>
                )}
              </section>

              <aside className="booking-summary">
                <p className="marketplace-kicker">Resumo</p>
                <h2>{service.titulo}</h2>
                <p className="booking-summary__provider">com {provider?.nome_completo}</p>
                <dl>
                  <div><dt>Duração</dt><dd>{service.duracao_padrao} min</dd></div>
                  <div><dt>Data</dt><dd>{activeDate ? new Date(`${activeDate}T12:00:00`).toLocaleDateString('pt-BR') : 'A definir'}</dd></div>
                  <div><dt>Horário</dt><dd>{activeTime || 'A definir'}</dd></div>
                </dl>
                <div className="booking-summary__price"><span>Valor do serviço</span><strong>{Number(service.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
                {errorMessage ? <p className="feedback feedback--danger">{errorMessage}</p> : null}
                <button className="button button--primary booking-submit" type="button" disabled={!activeTime} onClick={() => { setErrorMessage(''); setFeedbackMessage(''); setStage('confirm'); }}>
                  Continuar
                </button>
              </aside>
            </div>
            ) : (
              <section className="booking-summary booking-confirm">
                <p className="marketplace-kicker">Resumo</p>
                <h2>{service.titulo}</h2>
                <p className="booking-summary__provider">com {provider?.nome_completo}</p>
                <dl>
                  <div><dt>Duração</dt><dd>{service.duracao_padrao} min</dd></div>
                  <div><dt>Data</dt><dd>{new Date(`${(booked || { date: activeDate }).date}T12:00:00`).toLocaleDateString('pt-BR')}</dd></div>
                  <div><dt>Horário</dt><dd>{booked ? booked.time : activeTime}</dd></div>
                </dl>
                <div className="booking-summary__price"><span>Valor do serviço</span><strong>{Number(service.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
                {errorMessage ? <p className="feedback feedback--danger">{errorMessage}</p> : null}
                {feedbackMessage ? <p className="feedback feedback--success">{feedbackMessage}</p> : null}
                {stage === 'confirm' ? (
                  <>
                    {isAuthenticated ? null : <p className="booking-login-hint">Você precisará entrar na sua conta para enviar a solicitação.</p>}
                    <button className="button button--primary booking-submit" type="button" disabled={isSubmitting} onClick={requestBooking}>
                      {isSubmitting ? 'Enviando...' : isAuthenticated ? 'Confirmar solicitação' : 'Entrar e continuar'}
                    </button>
                    <button className="booking-history-link" type="button" disabled={isSubmitting} onClick={() => { setErrorMessage(''); setStage('date'); }}>Voltar</button>
                  </>
                ) : (
                  <>
                    <Link className="button button--primary booking-submit booking-confirm__destination" to={String(user?.tipo_conta).toUpperCase() === 'CLIENTE' ? getClientPath('agendamentos') : getDashboardPathForAccountType(user?.tipo_conta)}>{String(user?.tipo_conta).toUpperCase() === 'CLIENTE' ? 'Ver meus agendamentos' : 'Ir para meu painel'}</Link>
                    <Link className="booking-history-link booking-history-link--plain" to={getProviderProfilePath(providerId)}>Voltar</Link>
                  </>
                )}
              </section>
            )}
          </>
        ) : null}
    </main>
  );
}