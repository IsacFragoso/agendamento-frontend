import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Camera, Check, CheckCircle2, LoaderCircle, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { getProviderPath } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { useProviderAppointments } from '../../appointments/hooks/useProviderAppointments';
import { useProviderServices } from '../../services/hooks/useProviderServices';
import { formatCurrency, formatDate, formatTime } from '../../../shared/utils/format';
import ImageAdjustDialog from '../../../shared/components/ImageAdjustDialog';
import { getProviderAccount, uploadProviderBanner } from '../services/provider-location.service';
import './ProviderPortfolioPage.css';

const PROFILE_PHOTO_PLACEHOLDER = '/images/user-placeholder.jpg';
const NOTICE_DURATION_MS = 4500;
const MAX_NOTICES = 3;
const STATUS_LABELS = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmada',
  CONCLUIDO: 'Concluída',
  CANCELADO: 'Cancelada',
  NAO_COMPARECEU: 'Não compareceu',
};
const serviceId = (service) => service.id_servico || service.id;
const appointmentId = (appointment) => appointment.id_agendamento || appointment.id;

function ServiceEditDialog({ service, categories, onClose, onSave, isSaving, error }) {
  const [values, setValues] = useState({
    titulo: service.titulo || '',
    descricao: service.descricao || '',
    preco: String(service.preco ?? ''),
    duracao_padrao: String(service.duracao_padrao ?? ''),
    id_categoria: String(service.categoria?.id_categoria || service.id_categoria || ''),
  });
  const change = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSave(serviceId(service), {
      titulo: values.titulo.trim(),
      descricao: values.descricao.trim(),
      preco: Number(values.preco),
      duracao_padrao: Number(values.duracao_padrao),
      id_categoria: Number(values.id_categoria),
    });
  };

  return (
    <div className="portfolio-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="portfolio-dialog" role="dialog" aria-modal="true" aria-labelledby="portfolio-edit-title">
        <header className="portfolio-dialog-heading">
          <h2 id="portfolio-edit-title">Editar serviço</h2>
          <button className="portfolio-icon-button" type="button" onClick={onClose} aria-label="Fechar edição"><X size={18} aria-hidden="true" /></button>
        </header>
        {error ? <p className="feedback feedback--danger" role="alert">{error}</p> : null}
        <form className="portfolio-form" onSubmit={submit}>
          <label className="field"><span>Nome do serviço</span><input value={values.titulo} onChange={(event) => change('titulo', event.target.value)} minLength="2" required /></label>
          <label className="field"><span>Descrição</span><textarea value={values.descricao} onChange={(event) => change('descricao', event.target.value)} rows="3" /></label>
          <div className="portfolio-form-grid">
            <label className="field"><span>Duração (minutos)</span><input type="number" min="1" value={values.duracao_padrao} onChange={(event) => change('duracao_padrao', event.target.value)} required /></label>
            <label className="field"><span>Preço (R$)</span><input type="number" min="0" step="0.01" value={values.preco} onChange={(event) => change('preco', event.target.value)} required /></label>
          </div>
          <label className="field">
            <span>Categoria</span>
            <select value={values.id_categoria} onChange={(event) => change('id_categoria', event.target.value)} required>
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => <option key={category.id_categoria} value={category.id_categoria}>{category.nome}</option>)}
            </select>
          </label>
          <div className="portfolio-dialog-actions">
            <button className="button button--secondary" type="button" onClick={onClose}>Cancelar</button>
            <button className="button button--primary" type="submit" disabled={isSaving}><Check size={16} aria-hidden="true" />{isSaving ? 'Salvando...' : 'Salvar serviço'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ServiceDetailsDialog({ service, onClose }) {
  return (
    <div className="portfolio-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="portfolio-dialog" role="dialog" aria-modal="true" aria-labelledby="portfolio-service-details-title">
        <header className="portfolio-dialog-heading">
          <h2 id="portfolio-service-details-title">Detalhes do serviço</h2>
          <button className="portfolio-icon-button" type="button" onClick={onClose} aria-label="Fechar detalhes do serviço"><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="portfolio-service-details-copy">
          <p className="portfolio-service-details-category">{service.categoria?.nome || 'Sem categoria'}</p>
          <h3>{service.titulo}</h3>
          <p className="portfolio-service-details-description">{service.descricao || 'Nenhuma descrição cadastrada.'}</p>
          <dl className="portfolio-service-details-grid">
            <div><dt>Preço</dt><dd>{formatCurrency(service.preco)}</dd></div>
            <div><dt>Duração</dt><dd>{service.duracao_padrao} minutos</dd></div>
            <div><dt>Status</dt><dd>{service.ativo ? 'Ativo para agendamentos' : 'Pausado'}</dd></div>
          </dl>
        </div>
        <button className="button button--secondary portfolio-close-button" type="button" onClick={onClose}>Fechar</button>
      </section>
    </div>
  );
}

export default function ProviderPortfolioPage() {
  const { token, user } = useAuth();
  const services = useProviderServices({ providerId: user?.id, token });
  const appointments = useProviderAppointments({ token });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerToAdjust, setBannerToAdjust] = useState(null);
  const [providerBanner, setProviderBanner] = useState('');
  const [isLoadingBanner, setIsLoadingBanner] = useState(true);
  const [bannerLoadError, setBannerLoadError] = useState('');
  const bannerUpdateVersion = useRef(0);
  const [notices, setNotices] = useState([]);
  const nextNoticeId = useRef(0);

  useEffect(() => {
    let isCurrent = true;

    const loadProviderBanner = async () => {
      const requestVersion = bannerUpdateVersion.current;
      setIsLoadingBanner(true);
      setBannerLoadError('');
      try {
        const account = await getProviderAccount(user?.id, token);
        if (isCurrent && bannerUpdateVersion.current === requestVersion) {
          setProviderBanner(account?.perfil_prestador?.imagem_banner || '');
        }
      } catch {
        if (isCurrent) setBannerLoadError('Não foi possível carregar o banner profissional.');
      } finally {
        if (isCurrent) setIsLoadingBanner(false);
      }
    };

    if (user?.id && token) void loadProviderBanner();
    return () => {
      isCurrent = false;
    };
  }, [token, user?.id]);

  useEffect(() => {
    const expiringNotices = notices.filter((notice) => notice.kind !== 'pending');
    if (expiringNotices.length === 0) return undefined;

    const oldestExpiry = Math.min(...expiringNotices.map((notice) => notice.createdAt + NOTICE_DURATION_MS));
    const timerId = window.setTimeout(() => {
      const now = Date.now();
      setNotices((current) => current.filter((notice) => (
        notice.kind === 'pending' || notice.createdAt + NOTICE_DURATION_MS > now
      )).slice(-MAX_NOTICES));
    }, Math.max(0, oldestExpiry - Date.now()));

    return () => window.clearTimeout(timerId);
  }, [notices]);

  const addNotice = (kind, message) => {
    const id = nextNoticeId.current;
    nextNoticeId.current += 1;
    setNotices((current) => [...current, { id, kind, message, createdAt: Date.now() }].slice(-MAX_NOTICES));
    return id;
  };

  const updateNotice = (id, kind, message) => {
    setNotices((current) => current.map((notice) => (
      notice.id === id ? { ...notice, kind, message, createdAt: Date.now() } : notice
    )));
  };

  const dismissNotice = (id) => setNotices((current) => current.filter((notice) => notice.id !== id));

  const recentAppointments = useMemo(() => (
    [...appointments.appointments]
      .sort((first, second) => new Date(second.data_hora_inicio) - new Date(first.data_hora_inicio))
      .slice(0, 5)
  ), [appointments.appointments]);

  const changeActive = async (service) => {
    const id = serviceId(service);
    const isActivating = !service.ativo;
    const noticeId = addNotice('pending', isActivating ? 'Ativando serviço...' : 'Pausando serviço...');
    setUpdatingServiceId(id);
    const result = await services.updateServiceRecord(id, { ativo: isActivating });
    if (result.succeeded) {
      updateNotice(noticeId, 'success', isActivating ? 'Serviço ativado.' : 'Serviço pausado.');
    } else {
      dismissNotice(noticeId);
    }
    setUpdatingServiceId(null);
  };

  const saveEdit = async (id, payload) => {
    const noticeId = addNotice('pending', 'Salvando serviço...');
    setIsSavingEdit(true);
    const result = await services.updateServiceRecord(id, payload);
    if (result.succeeded) {
      setEditingService(null);
      updateNotice(noticeId, 'success', 'Serviço atualizado.');
    } else {
      dismissNotice(noticeId);
    }
    setIsSavingEdit(false);
  };

  const removeService = async (service) => {
    if (!window.confirm(`Excluir o serviço "${service.titulo}"?`)) return;
    const noticeId = addNotice('pending', 'Excluindo serviço...');
    if (await services.removeService(serviceId(service))) {
      updateNotice(noticeId, 'success', 'Serviço excluído.');
    } else {
      dismissNotice(noticeId);
    }
  };

  const addService = async (event) => {
    const noticeId = addNotice('pending', 'Cadastrando serviço...');
    if (await services.submitService(event)) {
      setShowAddForm(false);
      updateNotice(noticeId, 'success', 'Serviço cadastrado.');
    } else {
      dismissNotice(noticeId);
    }
  };

  const uploadBanner = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      addNotice('error', 'Escolha uma imagem JPG, PNG ou WebP de até 5 MB.');
      return;
    }

    setBannerToAdjust(file);
  };

  const saveAdjustedBanner = async (file) => {
    setIsUploadingBanner(true);
    try {
      const profile = await uploadProviderBanner(user.id, file, token);
      const account = profile?.imagem_banner || profile?.perfil_prestador?.imagem_banner
        ? null
        : await getProviderAccount(user.id, token);
      const bannerUrl = profile?.imagem_banner
        || profile?.perfil_prestador?.imagem_banner
        || account?.perfil_prestador?.imagem_banner;
      if (!bannerUrl) throw new Error('O banner foi enviado, mas não foi possível obter sua imagem.');
      bannerUpdateVersion.current += 1;
      setProviderBanner(bannerUrl);
      addNotice('success', 'Banner profissional atualizado.');
      setBannerToAdjust(null);
      return true;
    } catch (error) {
      addNotice('error', error?.message || 'Não foi possível enviar o banner.');
      return false;
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const appointmentStatus = (status) => STATUS_LABELS[String(status || '').toUpperCase()] || status || 'Indisponível';

  return (
    <div className="page-stack provider-portfolio-page">
      <header className="portfolio-page-heading">
        <div><p className="portfolio-eyebrow">Área do prestador</p><h1>Painel Profissional</h1></div>
        <span>{user?.nome_completo}</span>
      </header>
      <nav className="portfolio-tabs" aria-label="Seção do painel profissional"><span className="portfolio-tab is-active">Serviços</span></nav>

      <section className="card portfolio-banner-panel">
        <div className="portfolio-section-heading">
          <div><h2>Banner profissional</h2><p>Uma única imagem para apresentar seu trabalho.</p></div>
          <label className="button button--secondary portfolio-banner-button">
            <Camera size={16} aria-hidden="true" />
            {bannerToAdjust ? 'Imagem selecionada' : 'Alterar banner'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadBanner} disabled={isUploadingBanner || Boolean(bannerToAdjust)} />
          </label>
        </div>
        {isLoadingBanner ? <p className="meta-text">Carregando banner...</p> : null}
        {bannerLoadError ? <p className="feedback feedback--danger" role="alert">{bannerLoadError}</p> : null}
        {providerBanner ? (
          <img
            className="portfolio-banner-image"
            src={providerBanner}
            alt="Banner profissional"
            onError={() => {
              setProviderBanner('');
              setBannerLoadError('Não foi possível exibir o banner salvo.');
            }}
          />
        ) : null}
      </section>

      <div className="portfolio-toast-stack" aria-live="polite" aria-relevant="additions text">
        {notices.map((notice) => {
          const NoticeIcon = notice.kind === 'success' ? CheckCircle2 : notice.kind === 'error' ? AlertCircle : LoaderCircle;
          return (
            <div className={`portfolio-toast portfolio-toast--${notice.kind}`} key={notice.id} role={notice.kind === 'error' ? 'alert' : 'status'}>
              <NoticeIcon className={notice.kind === 'pending' ? 'portfolio-toast__spinner' : ''} size={18} aria-hidden="true" />
              <span>{notice.message}</span>
              <button className="portfolio-toast__dismiss" type="button" aria-label="Dispensar mensagem" onClick={() => dismissNotice(notice.id)}>
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {services.errorMessage || appointments.errorMessage ? (
        <p className="feedback feedback--danger" role="alert">{services.errorMessage || appointments.errorMessage}</p>
      ) : null}

      <section className="card portfolio-services" aria-labelledby="portfolio-services-heading">
        <div className="portfolio-section-heading">
          <div><h2 id="portfolio-services-heading">Seus serviços</h2><p>Gerencie os serviços disponíveis para agendamento.</p></div>
          <span className="portfolio-count">{services.services.length} serviços</span>
        </div>
        {services.isLoading ? <p className="meta-text">Carregando serviços...</p> : null}
        {!services.isLoading && services.services.length === 0 ? <p className="empty-state">Você ainda não publicou serviços.</p> : null}

        {services.services.length > 0 ? (
          <div className="table-wrapper portfolio-table-scroll">
            <table className="table portfolio-service-table">
              <thead><tr><th>Serviço</th><th>Duração</th><th>Preço</th><th>Status</th><th className="portfolio-actions-heading">Ações</th></tr></thead>
              <tbody>
                {services.services.map((service) => (
                  <tr key={serviceId(service)}>
                    <td><strong>{service.titulo}</strong>{service.categoria?.nome ? <small>{service.categoria.nome}</small> : null}</td>
                    <td>{service.duracao_padrao} min</td>
                    <td className="portfolio-price">{formatCurrency(service.preco)}</td>
                    <td>
                      <button className={`portfolio-switch ${service.ativo ? 'is-active' : ''}`} type="button" role="switch" aria-checked={Boolean(service.ativo)} aria-label={`${service.ativo ? 'Pausar' : 'Ativar'} ${service.titulo}`} disabled={updatingServiceId === serviceId(service)} onClick={() => changeActive(service)}>
                        <span />
                      </button>
                    </td>
                    <td><div className="portfolio-actions">
                      <button className="portfolio-action portfolio-action--view" type="button" title={`Visualizar ${service.titulo}`} onClick={() => setSelectedService(service)}><Search size={16} aria-hidden="true" /><span>Visualizar</span></button>
                      <button className="portfolio-action" type="button" onClick={() => setEditingService(service)}><Pencil size={14} aria-hidden="true" />Editar</button>
                      <button className="portfolio-action is-danger" type="button" onClick={() => removeService(service)}><Trash2 size={14} aria-hidden="true" />Excluir</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <button className="button button--primary portfolio-add-button" type="button" onClick={() => setShowAddForm((visible) => !visible)}>
          {showAddForm ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          {showAddForm ? 'Cancelar' : 'Adicionar novo serviço'}
        </button>
        {showAddForm ? (
          <form className="portfolio-add-form" onSubmit={addService}>
            <label className="field"><span>Nome do serviço</span><input value={services.formValues.titulo} onChange={(event) => services.updateField('titulo', event.target.value)} minLength="2" required /></label>
            <label className="field"><span>Descrição</span><textarea value={services.formValues.descricao} onChange={(event) => services.updateField('descricao', event.target.value)} rows="2" required /></label>
            <div className="portfolio-add-fields">
              <label className="field"><span>Duração (minutos)</span><input type="number" min="1" value={services.formValues.duracao_padrao} onChange={(event) => services.updateField('duracao_padrao', event.target.value)} required /></label>
              <label className="field"><span>Preço (R$)</span><input type="number" min="0" step="0.01" value={services.formValues.preco} onChange={(event) => services.updateField('preco', event.target.value)} required /></label>
              <label className="field"><span>Categoria</span><select value={services.formValues.id_categoria} onChange={(event) => services.updateField('id_categoria', event.target.value)} required><option value="">Selecione</option>{services.categories.map((category) => <option key={category.id_categoria} value={category.id_categoria}>{category.nome}</option>)}</select></label>
            </div>
            <button className="button button--primary" type="submit" disabled={services.isSubmitting}>{services.isSubmitting ? 'Publicando...' : 'Publicar serviço'}</button>
          </form>
        ) : null}
      </section>

      <section className="portfolio-history" aria-labelledby="portfolio-history-heading">
        <div className="portfolio-section-heading">
          <div><h2 id="portfolio-history-heading">Histórico recente</h2><p>Últimos atendimentos e solicitações.</p></div>
          <Link to={getProviderPath('historico')} className="portfolio-history-link">Histórico completo <span aria-hidden="true">→</span></Link>
        </div>
        {appointments.isLoading ? <p className="meta-text">Carregando histórico...</p> : null}
        {!appointments.isLoading && recentAppointments.length === 0 ? <p className="empty-state">Seus agendamentos aparecerão aqui.</p> : null}
        {recentAppointments.length > 0 ? (
          <div className="table-wrapper portfolio-table-scroll">
            <table className="table portfolio-history-table">
              <thead><tr><th>Cliente</th><th>Serviço</th><th>Data e hora</th><th>Status</th><th>Ação</th></tr></thead>
              <tbody>{recentAppointments.map((appointment) => {
                const normalizedStatus = String(appointment.status || '').toUpperCase();
                const tone = normalizedStatus === 'CANCELADO' ? 'danger' : normalizedStatus === 'PENDENTE' ? 'warning' : normalizedStatus === 'CONCLUIDO' ? 'success' : 'neutral';
                return (
                  <tr key={appointmentId(appointment)}>
                    <td><div className="portfolio-client"><img src={appointment.cliente?.foto_perfil || PROFILE_PHOTO_PLACEHOLDER} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = PROFILE_PHOTO_PLACEHOLDER; }} /><strong>{appointment.cliente?.nome_completo || 'Cliente'}</strong></div></td>
                    <td className="portfolio-history-service">{appointment.servico?.titulo || 'Serviço não informado'}</td>
                    <td><span className="portfolio-date">{formatDate(appointment.data_hora_inicio)}</span><small className="portfolio-time">{formatTime(appointment.data_hora_inicio)}</small></td>
                    <td><span className={`status-badge status-badge--${tone}`}>{appointmentStatus(appointment.status)}</span></td>
                    <td><button className="portfolio-details-button" type="button" onClick={() => setSelectedAppointment(appointment)}>Detalhes</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : null}
      </section>

      {editingService ? <ServiceEditDialog service={editingService} categories={services.categories} onClose={() => setEditingService(null)} onSave={saveEdit} isSaving={isSavingEdit} error={services.errorMessage} /> : null}
      {selectedService ? <ServiceDetailsDialog service={selectedService} onClose={() => setSelectedService(null)} /> : null}
      {bannerToAdjust ? (
        <ImageAdjustDialog
          file={bannerToAdjust}
          kind="banner"
          onClose={() => setBannerToAdjust(null)}
          onSave={saveAdjustedBanner}
          isSaving={isUploadingBanner}
        />
      ) : null}
      {selectedAppointment ? (
        <div className="portfolio-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedAppointment(null); }}>
          <section className="portfolio-dialog" role="dialog" aria-modal="true" aria-labelledby="portfolio-details-heading">
            <header className="portfolio-dialog-heading"><h2 id="portfolio-details-heading">Detalhes do agendamento</h2><button className="portfolio-icon-button" type="button" onClick={() => setSelectedAppointment(null)} aria-label="Fechar detalhes"><X size={18} aria-hidden="true" /></button></header>
            <dl className="portfolio-details"><div><dt>Cliente</dt><dd>{selectedAppointment.cliente?.nome_completo || 'Cliente'}</dd></div><div><dt>Serviço</dt><dd>{selectedAppointment.servico?.titulo || 'Serviço não informado'}</dd></div><div><dt>Data e horário</dt><dd>{formatDate(selectedAppointment.data_hora_inicio)} às {formatTime(selectedAppointment.data_hora_inicio)}</dd></div><div><dt>Status</dt><dd>{appointmentStatus(selectedAppointment.status)}</dd></div></dl>
            <button className="button button--secondary portfolio-close-button" type="button" onClick={() => setSelectedAppointment(null)}>Fechar</button>
          </section>
        </div>
      ) : null}
    </div>
  );
}