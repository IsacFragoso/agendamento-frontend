import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { getErrorMessage } from '../../../core/http/http-error';
import { ROUTE_PATHS, getBookingPath } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { getProviderContacts, getPublicProvider, listProviderSchedule } from '../services/providers.service';
import './marketplace.css';

const WEEK_DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const formatPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 11 ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}` : String(value || '');
};

export default function ProviderProfilePage() {
  const { providerId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const isOwnProfile = isAuthenticated && String(user?.id) === String(providerId);
  const [provider, setProvider] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [contacts, setContacts] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      getPublicProvider(providerId),
      listProviderSchedule(providerId),
      getProviderContacts(providerId).catch(() => null),
    ])
      .then(([profile, hours, providerContacts]) => {
        if (!isCurrent) return;
        setProvider(profile);
        setSchedule(Array.isArray(hours) ? hours : []);
        setContacts(providerContacts);
      })
      .catch((error) => {
        if (isCurrent) setErrorMessage(getErrorMessage(error, 'Não foi possível carregar este profissional.'));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [providerId]);

  const categoryNames = [...new Set((provider?.servicos || []).map((service) => service.categoria?.nome).filter(Boolean))];

  return (
    <main className="provider-profile-page">
        <nav className="provider-breadcrumbs" aria-label="Você está em">
          <ol>
            <li><Link to={ROUTE_PATHS.marketplace}>Explorar</Link></li>
            <li aria-current="page">{provider?.nome_completo || 'Perfil do profissional'}</li>
          </ol>
        </nav>
        {isLoading ? <p className="marketplace-state">Carregando perfil...</p> : null}
        {errorMessage ? <p className="feedback feedback--danger">{errorMessage}</p> : null}

        {provider ? (
          <>
            <section className="provider-hero">
              <div className="provider-hero__cover">
                {provider.perfil?.imagem_banner ? (
                  <img src={provider.perfil.imagem_banner} alt={`Espaço de ${provider.nome_completo}`} />
                ) : <div className="provider-hero__cover-placeholder" />}
              </div>
              <div className="provider-hero__identity">
                {provider.perfil?.foto_perfil ? (
                  <img className="provider-hero__avatar" src={provider.perfil.foto_perfil} alt="" />
                ) : (
                  <span className="provider-hero__avatar provider-hero__avatar--fallback" aria-hidden="true">
                    {provider.nome_completo?.slice(0, 1)}
                  </span>
                )}
                <div className="provider-hero__heading">
                  <h1>{provider.nome_completo}</h1>
                  {categoryNames.length ? (
                    <ul className="provider-hero__tags" aria-label="Especialidades">
                      {categoryNames.map((name) => <li key={name}>{name}</li>)}
                    </ul>
                  ) : null}
                </div>
              </div>
            </section>

            <div className="provider-profile-grid">
              <section className="provider-services">
                <nav className="provider-tabs" aria-label="Seções do perfil">
                  <span className="provider-tabs__item is-active" aria-current="page">Serviços ({provider.servicos?.length || 0})</span>
                </nav>

                {provider.perfil?.bio ? <p className="provider-bio">{provider.perfil.bio}</p> : null}
                {!provider.servicos?.length ? (
                  <p className="provider-empty">Este profissional ainda não publicou serviços.</p>
                ) : null}

                {(provider.servicos || []).map((service) => (
                  <article className="provider-service-row" key={service.id_servico}>
                    <div>
                      <h3>{service.titulo}</h3>
                      <p className="provider-service-row__meta">
                        <span>◷ {service.duracao_padrao} min</span>
                        <span aria-hidden="true">•</span>
                        <strong>{Number(service.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      </p>
                      <p>{service.descricao || 'Atendimento profissional sob medida.'}</p>
                    </div>
                    {!isOwnProfile ? (
                      <div className="provider-service-row__action">
                        <Link className="button button--primary" to={getBookingPath(provider.id_prestador, service.id_servico)}>
                          Solicitar agendamento
                        </Link>
                      </div>
                    ) : null}
                  </article>
                ))}
              </section>

              <aside className="provider-hours">
                <h2>Horários de atendimento</h2>
                {schedule.length ? (
                  <ul>
                    {WEEK_DAYS.map((day, index) => {
                      const daySchedule = schedule.filter((item) => Number(item.dia_semana) === index);
                      return (
                        <li key={day}>
                          <span>{day}</span>
                          <span>{daySchedule.length
                            ? daySchedule.map((item) => `${String(item.hora_inicio).slice(0, 5)}–${String(item.hora_fim).slice(0, 5)}`).join(', ')
                            : 'Fechado'}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : <p className="provider-empty">Horários ainda não publicados.</p>}
                {contacts?.telefone || contacts?.email ? (
                  <div className="provider-contact">
                    <h3>Contato</h3>
                    {contacts.telefone ? (
                      <a href={`tel:${String(contacts.telefone).replace(/\D/g, '')}`}><Phone size={15} aria-hidden="true" /> {formatPhone(contacts.telefone)}</a>
                    ) : null}
                    {contacts.email ? (
                      <a href={`mailto:${contacts.email}`}><Mail size={15} aria-hidden="true" /> {contacts.email}</a>
                    ) : null}
                  </div>
                ) : null}
                <div className="provider-hours__note">
                  <span>i</span>
                  <p>Os horários escolhidos são confirmados pelo profissional após o envio da solicitação.</p>
                </div>
                {!isAuthenticated ? <Link className="provider-hours__login" to={ROUTE_PATHS.login}>Entrar para solicitar</Link> : null}
              </aside>
            </div>
          </>
        ) : null}
    </main>
  );
}