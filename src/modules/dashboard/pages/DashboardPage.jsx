import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getErrorMessage } from '../../../core/http/http-error';
import { useAuth } from '../../../core/store/use-auth';
import { usePublicProviders } from '../../services/hooks/usePublicProviders';
import { listCategories } from '../../services/services/services.service';
import { useClientAppointments } from '../../appointments/hooks/useClientAppointments';
import { formatCurrency } from '../../../shared/utils/format';
import { buildProviderCard } from '../utils/provider-card';

const INITIAL_BOOKING_FORM = { date: '', time: '09:00' };

function ClientBookingForm({ provider, onSuccess }) {
  const { token, user } = useAuth();
  const appointments = useClientAppointments({ clientId: user?.id, token });
  const [form, setForm] = useState(INITIAL_BOOKING_FORM);

  const submitBooking = async (event) => {
    event.preventDefault();
    const created = await appointments.requestAppointment({
      service: provider.servico,
      date: form.date,
      time: form.time,
    });

    if (created) onSuccess();
  };

  return (
    <section className="card card--highlighted">
      <div className="card__header">
        <div>
          <h2>Agendar serviço</h2>
          <p>{provider.nome} · {provider.servico?.titulo}</p>
        </div>
        <button className="button button--secondary" type="button" onClick={onSuccess}>Fechar</button>
      </div>
      {appointments.errorMessage ? <p className="feedback feedback--danger">{appointments.errorMessage}</p> : null}
      {appointments.feedbackMessage ? <p className="feedback feedback--success">{appointments.feedbackMessage}</p> : null}
      <form className="form-grid form-grid--compact" onSubmit={submitBooking}>
        <label className="field">
          <span>Data</span>
          <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
        </label>
        <label className="field">
          <span>Horário</span>
          <input type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} required />
        </label>
        <button className="button button--primary" type="submit" disabled={appointments.isSubmitting}>
          {appointments.isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
        </button>
      </form>
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const publicProviders = usePublicProviders();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const isClient = user?.tipo_conta === 'CLIENTE';

  useEffect(() => {
    let isCurrent = true;

    const loadCategories = async () => {
      setIsLoadingCategories(true);
      setCategoriesError('');

      try {
        const payload = await listCategories();
        if (isCurrent) setCategories(Array.isArray(payload) ? payload : []);
      } catch (error) {
        if (isCurrent) {
          setCategoriesError(getErrorMessage(error, 'Não foi possível carregar as categorias.'));
        }
      } finally {
        if (isCurrent) setIsLoadingCategories(false);
      }
    };

    void loadCategories();
    return () => {
      isCurrent = false;
    };
  }, []);

  const providerCards = publicProviders.providers.map(buildProviderCard);
  const visibleProviders = providerCards.filter((provider) => {
    const name = String(provider.nome || '').toLowerCase();
    return name.includes(search.toLowerCase())
      && (categoryId === 'all' || provider.categoryIds.includes(categoryId));
  });

  return (
    <div className="page-stack">
      <div className="dashboard-topbar">
        <label className="dashboard-search">
          <Search size={17} strokeWidth={1.8} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Procure serviços ou profissionais..." />
        </label>
      </div>

      <section className="dashboard-banner">
        <h1>Mostrando {visibleProviders.length} profissionais disponíveis</h1>
        <p>Descubra serviços oferecidos por profissionais.</p>
      </section>

      <div className="dashboard-filters">
        <div className="category-list">
          <button type="button" className={categoryId === 'all' ? 'is-active' : ''} onClick={() => setCategoryId('all')}>
            Todos
          </button>
          {categories.map((item) => (
            <button
              key={item.id_categoria}
              type="button"
              className={categoryId === String(item.id_categoria) ? 'is-active' : ''}
              onClick={() => setCategoryId(String(item.id_categoria))}
            >
              {item.nome}
            </button>
          ))}
        </div>
      </div>

      {isLoadingCategories ? <p className="meta-text">Carregando categorias...</p> : null}
      {categoriesError ? <p className="feedback feedback--danger">{categoriesError}</p> : null}

      <section className="card">
        <div className="card__header">
          <div>
            <h2>Profissionais disponíveis</h2>
            <p>Explore serviços oferecidos por profissionais da região.</p>
          </div>
        </div>

        {publicProviders.errorMessage ? <p className="feedback feedback--danger">{publicProviders.errorMessage}</p> : null}
        {publicProviders.isLoading ? <p className="meta-text">Carregando profissionais...</p> : null}
        {!publicProviders.isLoading && !publicProviders.errorMessage && visibleProviders.length === 0 ? (
          <p className="empty-state">Nenhum profissional encontrado.</p>
        ) : null}

        <div className="service-grid client-service-grid">
          {visibleProviders.map((provider) => (
            <article className="service-option" key={provider.id}>
              <div className="service-option__image" style={{ backgroundImage: `url(${provider.image})` }} />
              <div className="service-option__header">
                <div>
                  <span className="service-category">{provider.categoria}</span>
                  <strong>{provider.nome}</strong>
                  <p>{provider.descricao}</p>
                  {provider.distanciaKm !== null && provider.distanciaKm !== undefined ? (
                    <p>{provider.distanciaKm.toFixed(1)} km de distância</p>
                  ) : null}
                </div>
              </div>
              <div className="service-price">
                <span>A partir de<strong>{provider.preco !== null ? formatCurrency(provider.preco) : 'Sob consulta'}</strong></span>
                {isClient ? (
                  <button
                    className="button button--primary"
                    type="button"
                    disabled={!provider.servico}
                    onClick={() => setSelectedProvider(provider)}
                  >
                    {selectedProvider?.id === provider.id ? 'Selecionado' : 'Agende já'}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {isClient && selectedProvider ? (
        <ClientBookingForm
          key={selectedProvider.id}
          provider={selectedProvider}
          onSuccess={() => setSelectedProvider(null)}
        />
      ) : null}
    </div>
  );
}
