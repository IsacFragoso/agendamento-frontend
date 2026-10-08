import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../../core/http/http-error';
import { ROUTE_PATHS } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { listCategories } from '../../services/services/services.service';
import { listPublicProviders } from '../services/providers.service';
import './marketplace.css';

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const getInitials = (name) => String(name || 'Profissional')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase();

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    Promise.all([listPublicProviders(), listCategories()])
      .then(([providerPayload, categoryPayload]) => {
        if (!isCurrent) return;
        setProviders(Array.isArray(providerPayload) ? providerPayload : []);
        setCategories(Array.isArray(categoryPayload) ? categoryPayload : []);
      })
      .catch((error) => {
        if (isCurrent) setErrorMessage(getErrorMessage(error, 'Não foi possível carregar os profissionais.'));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const services = useMemo(() => providers.flatMap((provider) => (
    (provider.servicos || []).map((service) => ({
      ...service,
      provider,
    }))
  )), [providers]);

  const visibleServices = useMemo(() => {
    const query = normalize(submittedSearch);

    return services.filter(({ provider, categoria, titulo, descricao }) => {
      const matchesQuery = !query || normalize([
        provider.nome_completo,
        categoria?.nome,
        titulo,
        descricao,
      ].join(' ')).includes(query);
      const matchesCategory = !selectedCategory || categoria?.nome === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [selectedCategory, services, submittedSearch]);

  const openBooking = (providerId, serviceId) => {
    const path = `${ROUTE_PATHS.providers}/${providerId}/agendar/${serviceId}`;
    navigate(path);
  };

  return (
    <main className="marketplace-page">
        <header className="marketplace-topbar">
          <Link className="marketplace-brand" to={ROUTE_PATHS.marketplace} aria-label="SAPNE, início">
            <span className="marketplace-brand__mark">✦</span>
            <span>SAPNE</span>
          </Link>
          <form className="marketplace-search" onSubmit={(event) => {
            event.preventDefault();
            setSubmittedSearch(search.trim());
          }}>
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Buscar serviços ou profissionais"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Procure serviços ou profissionais..."
            />
            <button type="submit">Buscar</button>
          </form>
          <div className="marketplace-account">
            {isAuthenticated ? (
              <span>{user?.nome_completo || 'Minha conta'}</span>
            ) : (
              <>
                <Link to={ROUTE_PATHS.login}>Entrar</Link>
                <Link className="button button--primary" to={ROUTE_PATHS.register}>Criar conta</Link>
              </>
            )}
          </div>
        </header>

        <section className="marketplace-intro">
          <div>
            <span className="marketplace-kicker">Cuidado e serviços perto de você</span>
            <h1>Encontre quem faz bem feito.</h1>
            <p>Profissionais independentes, serviços claros e agendamento sem complicação.</p>
          </div>
          <div className="marketplace-intro__note">
            <span>01</span>
            <p>Descubra um profissional para o que você precisa hoje.</p>
          </div>
        </section>

        <section className="marketplace-catalog" aria-label="Catálogo de serviços">
          <div className="marketplace-catalog__heading">
            <div>
              <p className="marketplace-kicker">Catálogo</p>
              <h2>{submittedSearch ? `Resultados para “${submittedSearch}”` : 'Explore por especialidade'}</h2>
            </div>
            <span className="marketplace-count">{visibleServices.length} serviços</span>
          </div>

          <div className="marketplace-categories" role="group" aria-label="Filtrar por categoria">
            <button
              className={!selectedCategory ? 'is-active' : ''}
              type="button"
              onClick={() => setSelectedCategory('')}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                className={selectedCategory === category.nome ? 'is-active' : ''}
                key={category.id_categoria}
                type="button"
                onClick={() => setSelectedCategory(category.nome)}
              >
                {category.nome}
              </button>
            ))}
          </div>

          {errorMessage ? <p className="feedback feedback--danger">{errorMessage}</p> : null}
          {isLoading ? <p className="marketplace-state">Carregando profissionais...</p> : null}
          {!isLoading && !errorMessage && visibleServices.length === 0 ? (
            <div className="marketplace-empty">
              <span aria-hidden="true">⌕</span>
              <h3>Nenhum serviço encontrado</h3>
              <p>Tente outra busca ou escolha uma categoria diferente.</p>
            </div>
          ) : null}

          <div className="marketplace-grid">
            {visibleServices.map(({ provider, ...service }, index) => {
              const cover = provider.perfil?.imagem_banner || provider.perfil?.foto_perfil;
              const providerId = provider.id_prestador;
              const serviceId = service.id_servico;

              return (
                <article className="market-card" key={serviceId} style={{ '--card-index': index }}>
                  <Link className="market-card__cover" to={`${ROUTE_PATHS.providers}/${providerId}`}>
                    {cover ? (
                      <img src={cover} alt={`Espaço de ${provider.nome_completo}`} loading="lazy" />
                    ) : (
                      <div className="market-card__placeholder" aria-label="Imagem do profissional indisponível">
                        <span>{getInitials(provider.nome_completo)}</span>
                        <small>{service.categoria?.nome || 'Profissional'}</small>
                      </div>
                    )}
                    <span className="market-card__category">{service.categoria?.nome || 'Serviço'}</span>
                  </Link>
                  <div className="market-card__body">
                    <div className="market-card__title-row">
                      <div>
                        <p className="market-card__provider">{provider.nome_completo}</p>
                        <h3>{service.titulo}</h3>
                      </div>
                      {provider.perfil?.foto_perfil ? (
                        <img className="market-card__avatar" src={provider.perfil.foto_perfil} alt="" />
                      ) : (
                        <span className="market-card__avatar market-card__avatar--initials">{getInitials(provider.nome_completo)}</span>
                      )}
                    </div>
                    <p className="market-card__description">{service.descricao || 'Atendimento profissional sob medida.'}</p>
                    <div className="market-card__footer">
                      <span><small>A partir de</small><strong>{Number(service.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                      <button
                        className="button button--primary"
                        type="button"
                        onClick={() => openBooking(providerId, serviceId)}
                      >
                        Agendar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
    </main>
  );
}