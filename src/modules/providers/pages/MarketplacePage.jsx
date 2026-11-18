import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../../core/http/http-error';
import { getBookingPath, getProviderProfilePath } from '../../../core/router/paths';
import { listCategories } from '../../services/services/services.service';
import { listPublicProviders } from '../services/providers.service';
import './marketplace.css';

const RADIUS_OPTIONS = [5, 10, 25, 50];
const SECTION_LIMIT = 6;

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
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [nearby, setNearby] = useState(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    listCategories()
      .then((payload) => {
        if (isCurrent) setCategories(Array.isArray(payload) ? payload : []);
      })
      .catch(() => {
        if (isCurrent) setCategories([]);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    listPublicProviders({ ...nearby, radiusKm })
      .then((payload) => {
        if (!isCurrent) return;
        setErrorMessage('');
        setProviders(Array.isArray(payload) ? payload : []);
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
  }, [nearby, radiusKm]);

  const findNearby = () => {
    if (!navigator.geolocation) {
      setLocationError('Seu navegador não permite obter a localização.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLoading(true);
        setNearby({ latitude: coords.latitude, longitude: coords.longitude });
        setIsLocating(false);
      },
      () => {
        setLocationError('Não foi possível obter sua localização. Verifique a permissão do navegador.');
        setIsLocating(false);
      },
      { timeout: 10000 },
    );
  };

  const clearNearby = () => {
    setIsLoading(true);
    setNearby(null);
  };

  const changeRadius = (value) => {
    setIsLoading(true);
    setRadiusKm(Number(value));
  };

  const services = useMemo(() => providers.flatMap((provider) => (
    (provider.servicos || []).map((service) => ({
      ...service,
      provider,
    }))
  )), [providers]);

  const visibleServices = useMemo(() => {
    const query = normalize(search);

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
  }, [search, selectedCategory, services]);

  const visibleProviders = useMemo(() => {
    const query = normalize(search);

    return providers.filter((provider) => {
      const providerServices = provider.servicos || [];
      const matchesQuery = !query || normalize([
        provider.nome_completo,
        provider.perfil?.bio,
        ...providerServices.flatMap((service) => [service.categoria?.nome, service.titulo, service.descricao]),
      ].join(' ')).includes(query);
      const matchesCategory = !selectedCategory
        || providerServices.some((service) => service.categoria?.nome === selectedCategory);
      return matchesQuery && matchesCategory;
    });
  }, [providers, search, selectedCategory]);

  const shownProviders = showAllProviders ? visibleProviders : visibleProviders.slice(0, SECTION_LIMIT);
  const shownServices = showAllServices ? visibleServices : visibleServices.slice(0, SECTION_LIMIT);

  const openBooking = (providerId, serviceId) => {
    navigate(getBookingPath(providerId, serviceId));
  };

  return (
    <main className="marketplace-page">
        <header className="marketplace-topbar">
          <div className="marketplace-search" role="search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Buscar serviços ou profissionais"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Procure serviços ou profissionais..."
            />
          </div>
        </header>

        <section className="marketplace-intro">
          <div>
            <span className="marketplace-kicker">Cuidado e serviços perto de você</span>
            <h1>Encontre quem faz bem feito.</h1>
            <p>Profissionais independentes, serviços claros e agendamento sem complicação.</p>
            <h2 className="marketplace-intro__count">Mostrando {visibleProviders.length} profissionais disponíveis</h2>
          </div>
          <div className="marketplace-intro__note">
            <p>Descubra um profissional para o que você precisa hoje.</p>
          </div>
        </section>

        <div className="marketplace-filters">
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

          <div className="marketplace-location">
            {nearby ? (
              <>
                <label>
                  <span>Raio</span>
                  <select value={radiusKm} onChange={(event) => changeRadius(event.target.value)}>
                    {RADIUS_OPTIONS.map((option) => <option key={option} value={option}>{option} km</option>)}
                  </select>
                </label>
                <button type="button" className="is-active" onClick={clearNearby}>Perto de mim ✕</button>
              </>
            ) : (
              <button type="button" onClick={findNearby} disabled={isLocating}>
                {isLocating ? 'Localizando...' : 'Perto de mim'}
              </button>
            )}
          </div>
        </div>
        {locationError ? <p className="feedback feedback--danger" role="alert">{locationError}</p> : null}
        {errorMessage ? <p className="feedback feedback--danger">{errorMessage}</p> : null}
        {isLoading ? <p className="marketplace-state">Carregando profissionais...</p> : null}

        <section className="marketplace-providers" aria-label="Profissionais">
          <div className="marketplace-section-actions">
            <button
              className="marketplace-see-all"
              type="button"
              disabled={visibleProviders.length <= SECTION_LIMIT}
              onClick={() => setShowAllProviders((value) => !value)}
            >
              {showAllProviders ? 'Ver menos' : 'Ver todos os profissionais'}
            </button>
          </div>

          {!isLoading && !errorMessage && visibleProviders.length === 0 ? (
            <div className="marketplace-empty">
              <span aria-hidden="true">⌕</span>
              <h3>Nenhum profissional encontrado</h3>
              <p>Tente outra busca ou escolha uma categoria diferente.</p>
            </div>
          ) : null}

          <div className="marketplace-grid">
            {shownProviders.map((provider, index) => {
              const cover = provider.perfil?.imagem_banner || provider.perfil?.foto_perfil;
              const providerId = provider.id_prestador;
              const categoryNames = [...new Set((provider.servicos || []).map((service) => service.categoria?.nome).filter(Boolean))];
              const prices = (provider.servicos || []).map((service) => Number(service.preco || 0));

              return (
                <article className="market-card" key={providerId} style={{ '--card-index': index }}>
                  <Link className="market-card__cover" to={getProviderProfilePath(providerId)}>
                    {cover ? (
                      <img src={cover} alt={`Espaço de ${provider.nome_completo}`} loading="lazy" />
                    ) : (
                      <div className="market-card__placeholder" aria-label="Imagem do profissional indisponível">
                        <span>{getInitials(provider.nome_completo)}</span>
                      </div>
                    )}
                    {categoryNames[0] ? <span className="market-card__category">{categoryNames[0]}</span> : null}
                  </Link>
                  <div className="market-card__body">
                    <div className="market-card__title-row">
                      <div>
                        <h3><Link to={getProviderProfilePath(providerId)}>{provider.nome_completo}</Link></h3>
                        <p className="market-card__provider">
                          {provider.servicos?.length || 0} {provider.servicos?.length === 1 ? 'serviço' : 'serviços'}
                          {provider.distancia_km != null ? <small> · {Number(provider.distancia_km).toFixed(1)} km</small> : null}
                        </p>
                      </div>
                      <Link className="market-card__avatar-link" to={getProviderProfilePath(providerId)} aria-label={`Ver perfil de ${provider.nome_completo}`}>
                        {provider.perfil?.foto_perfil ? (
                          <img className="market-card__avatar" src={provider.perfil.foto_perfil} alt="" />
                        ) : (
                          <span className="market-card__avatar market-card__avatar--initials">{getInitials(provider.nome_completo)}</span>
                        )}
                      </Link>
                    </div>
                    <p className="market-card__description">
                      {provider.perfil?.bio || (categoryNames.length ? categoryNames.join(' · ') : 'Profissional independente.')}
                    </p>
                    <div className="market-card__footer">
                      {prices.length ? (
                        <span><small>A partir de</small><strong>{Math.min(...prices).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                      ) : <span />}
                      <div className="market-card__actions">
                        <Link className="button button--primary" to={getProviderProfilePath(providerId)}>Ver perfil</Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="marketplace-catalog" aria-label="Catálogo de serviços">
          <div className="marketplace-catalog__heading">
            <div>
              <p className="marketplace-kicker">Catálogo</p>
              <h2>{search.trim() ? `Resultados para “${search.trim()}”` : 'Explore por especialidade'}</h2>
            </div>
            <div className="marketplace-catalog__actions">
              <span className="marketplace-count">{visibleServices.length} serviços</span>
              <button
                className="marketplace-see-all"
                type="button"
                disabled={visibleServices.length <= SECTION_LIMIT}
                onClick={() => setShowAllServices((value) => !value)}
              >
                {showAllServices ? 'Ver menos' : 'Ver todos os serviços'}
              </button>
            </div>
          </div>
          {!isLoading && !errorMessage && visibleServices.length === 0 ? (
            <div className="marketplace-empty">
              <span aria-hidden="true">⌕</span>
              <h3>Nenhum serviço encontrado</h3>
              <p>Tente outra busca ou escolha uma categoria diferente.</p>
            </div>
          ) : null}

          <div className="marketplace-grid">
            {shownServices.map(({ provider, ...service }, index) => {
              const cover = provider.perfil?.imagem_banner || provider.perfil?.foto_perfil;
              const providerId = provider.id_prestador;
              const serviceId = service.id_servico;

              return (
                <article className="market-card" key={serviceId} style={{ '--card-index': index }}>
                  <Link className="market-card__cover" to={getProviderProfilePath(providerId)}>
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
                        <p className="market-card__provider">
                          <Link to={getProviderProfilePath(providerId)}>{provider.nome_completo}</Link>
                          {provider.distancia_km != null ? <small> · {Number(provider.distancia_km).toFixed(1)} km</small> : null}
                        </p>
                        <h3>{service.titulo}</h3>
                      </div>
                      <Link className="market-card__avatar-link" to={getProviderProfilePath(providerId)} aria-label={`Ver perfil de ${provider.nome_completo}`}>
                        {provider.perfil?.foto_perfil ? (
                          <img className="market-card__avatar" src={provider.perfil.foto_perfil} alt="" />
                        ) : (
                          <span className="market-card__avatar market-card__avatar--initials">{getInitials(provider.nome_completo)}</span>
                        )}
                      </Link>
                    </div>
                    <p className="market-card__description">{service.descricao || 'Atendimento profissional sob medida.'}</p>
                    <div className="market-card__footer">
                      <span><small>A partir de</small><strong>{Number(service.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                      <div className="market-card__actions">
                        <Link className="button button--secondary" to={getProviderProfilePath(providerId)}>Ver perfil</Link>
                        <button
                          className="button button--primary"
                          type="button"
                          onClick={() => openBooking(providerId, serviceId)}
                        >
                          Agendar
                        </button>
                      </div>
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