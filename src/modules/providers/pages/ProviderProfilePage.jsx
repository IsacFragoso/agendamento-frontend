import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage } from '../../../core/http/http-error';
import { ROUTE_PATHS } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import AppLayout from '../../../shared/components/layouts/AppLayout';
import { getPublicProvider, listProviderSchedule } from '../services/providers.service';
import './marketplace.css';

const WEEK_DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function ProviderProfilePage() {
  const { providerId } = useParams();
  const { isAuthenticated } = useAuth();
  const [provider, setProvider] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([getPublicProvider(providerId), listProviderSchedule(providerId)])
      .then(([profile, hours]) => {
        if (!isCurrent) return;
        setProvider(profile);
        setSchedule(Array.isArray(hours) ? hours : []);
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

  return (
    <AppLayout menuItems={[]}>
      <main className="provider-profile-page">
        <Link className="profile-back-link" to={ROUTE_PATHS.marketplace}>← Voltar para os profissionais</Link>
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
                <div>
                  <p className="marketplace-kicker">Profissional independente</p>
                  <h1>{provider.nome_completo}</h1>
                </div>
                <span className="provider-hero__status"><i /> Agenda aberta</span>
              </div>
            </section>

            <div className="provider-profile-grid">
              <section className="provider-services">
                <div className="profile-section-heading">
                  <div>
                    <p className="marketplace-kicker">Atendimento</p>
                    <h2>Serviços disponíveis</h2>
                  </div>
                  <span>{provider.servicos?.length || 0} opções</span>
                </div>

                {provider.perfil?.bio ? <p className="provider-bio">{provider.perfil.bio}</p> : null}
                {!provider.servicos?.length ? (
                  <p className="provider-empty">Este profissional ainda não publicou serviços.</p>
                ) : null}

                {(provider.servicos || []).map((service) => (
                  <article className="provider-service-row" key={service.id_servico}>
                    <div>
                      <span className="provider-service-row__category">{service.categoria?.nome || 'Serviço'}</span>
                      <h3>{service.titulo}</h3>
                      <p>{service.descricao || 'Atendimento profissional sob medida.'}</p>
                      <span className="provider-service-row__duration">◷ {service.duracao_padrao} min</span>
                    </div>
                    <div className="provider-service-row__action">
                      <strong>{Number(service.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      <Link className="button button--primary" to={`${ROUTE_PATHS.providers}/${provider.id_prestador}/agendar/${service.id_servico}`}>
                        Solicitar horário
                      </Link>
                    </div>
                  </article>
                ))}
              </section>

              <aside className="provider-hours">
                <p className="marketplace-kicker">Disponibilidade semanal</p>
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
    </AppLayout>
  );
}