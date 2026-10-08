import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '../../../core/http/http-error';
import { ROUTE_PATHS, getClientPath, getDashboardPathForAccountType } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { createAppointment } from '../../appointments/services/appointments.service';
import {
  getProviderAvailability,
  getPublicProvider,
  listProviderSchedule,
} from '../services/providers.service';
import './marketplace.css';

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
  const [provider, setProvider] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [availability, setAvailability] = useState({ key: '', slots: [], error: '' });

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
  const availableDates = useMemo(() => {
    const scheduledDays = new Set(schedule.map((item) => Number(item.dia_semana)));
    const dates = [];
    const today = new Date();

    for (let offset = 0; offset < 21; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      if (scheduledDays.has(date.getDay())) dates.push(date);
    }

    return dates;
  }, [schedule]);
  const activeDate = selectedDate || (availableDates[0] ? asDateKey(availableDates[0]) : '');
  const availabilityKey = `${activeDate}:${serviceId}`;
  const timeOptions = availability.key === availabilityKey ? availability.slots : [];
  const activeTime = timeOptions.includes(selectedTime) ? selectedTime : '';

  useEffect(() => {
    if (!activeDate || !service) return undefined;
    let isCurrent = true;

    getProviderAvailability(providerId, serviceId, activeDate)
      .then((slots) => {
        if (isCurrent) {
          setAvailability({ key: availabilityKey, slots: Array.isArray(slots) ? slots : [], error: '' });
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setAvailability({
            key: availabilityKey,
            slots: [],
            error: getErrorMessage(error, 'Não foi possível consultar a disponibilidade.'),
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [activeDate, availabilityKey, providerId, service, serviceId]);

  const requestBooking = async () => {
    if (!isAuthenticated) {
      navigate(ROUTE_PATHS.login, { state: { from: `${location.pathname}${location.search}` } });
      return;
    }

    if (String(user?.tipo_conta).toUpperCase() !== 'CLIENTE') {
      setErrorMessage('Entre com uma conta de cliente para solicitar um horário.');
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
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível solicitar este horário.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated && String(user?.tipo_conta).toUpperCase() !== 'CLIENTE') {
    return (
      <section className="booking-message">
          <h1>Agendamento para clientes</h1>
          <p>Esta conta não pode solicitar um horário como cliente.</p>
          <Link className="button button--primary" to={getDashboardPathForAccountType(user?.tipo_conta)}>Ir para meu painel</Link>
      </section>
    );
  }

  return (
    <main className="booking-page">
        <Link className="profile-back-link" to={`${ROUTE_PATHS.providers}/${providerId}`}>← Voltar ao perfil</Link>
        {isLoading ? <p className="marketplace-state">Carregando disponibilidade...</p> : null}
        {errorMessage && !service ? <p className="feedback feedback--danger">{errorMessage}</p> : null}

        {service ? (
          <>
            <header className="booking-heading">
              <p className="marketplace-kicker">Solicitar agendamento</p>
              <h1>Escolha uma data e um horário.</h1>
              <p>A solicitação só fica confirmada depois da resposta do profissional.</p>
            </header>

            <div className="booking-layout">
              <section className="booking-selector">
                <div className="booking-step"><span>1</span><div><strong>Data</strong><small>Próximas três semanas</small></div></div>
                {availableDates.length ? (
                  <div className="booking-date-grid">
                    {availableDates.map((date) => {
                      const key = asDateKey(date);
                      const active = activeDate === key;
                      return (
                        <button className={active ? 'is-selected' : ''} key={key} type="button" onClick={() => { setSelectedDate(key); setSelectedTime(''); }}>
                          <small>{date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</small>
                          <strong>{date.getDate()}</strong>
                          <small>{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="booking-empty">Este profissional ainda não publicou horários para as próximas semanas.</p>
                )}

                <div className="booking-step booking-step--time"><span>2</span><div><strong>Horários disponíveis</strong><small>{activeDate ? new Date(`${activeDate}T12:00:00`).toLocaleDateString('pt-BR', { dateStyle: 'long' }) : 'Selecione uma data'}</small></div></div>
                {timeOptions.length ? (
                  <div className="booking-time-grid">
                    {timeOptions.map((time) => (
                      <button className={activeTime === time ? 'is-selected' : ''} key={time} type="button" onClick={() => setSelectedTime(time)}>
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="booking-empty">
                    {availability.error || (availability.key !== availabilityKey ? 'Consultando disponibilidade...' : 'Não há horários livres para esta data.')}
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
                {feedbackMessage ? <p className="feedback feedback--success">{feedbackMessage}</p> : null}
                {isAuthenticated ? null : <p className="booking-login-hint">Você precisará entrar em uma conta de cliente para enviar a solicitação.</p>}
                <button className="button button--primary booking-submit" type="button" disabled={isSubmitting || !activeTime} onClick={requestBooking}>
                  {isSubmitting ? 'Enviando...' : isAuthenticated ? 'Confirmar solicitação' : 'Entrar e continuar'}
                </button>
                {feedbackMessage ? <Link className="booking-history-link" to={getClientPath('agendamentos')}>Ver meus agendamentos</Link> : null}
              </aside>
            </div>
          </>
        ) : null}
    </main>
  );
}