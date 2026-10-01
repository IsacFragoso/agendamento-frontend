import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Camera, Check, LockKeyhole, Pencil, ShieldAlert, Trash2, UserRound } from 'lucide-react';
import { ROUTE_PATHS } from '../../../core/router/paths';
import { getErrorMessage } from '../../../core/http/http-error';
import { useAuth } from '../../../core/store/use-auth';
import ImageAdjustDialog from '../../../shared/components/ImageAdjustDialog';
import {
  changeAccountPassword,
  deactivateAccount,
  updateAccount,
  uploadAccountPhoto,
} from '../services/account.service';
import './AccountSettingsPage.css';

const PROFILE_PHOTO_PLACEHOLDER = '/images/user-placeholder.jpg';
const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)} - ${digits.slice(7)}`;
};

const phoneDigits = (value) => value.replace(/\D/g, '');

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { login, logout, token, user } = useAuth();
  const [name, setName] = useState(user?.nome_completo || '');
  const [phone, setPhone] = useState(formatPhoneNumber(user?.telefone || ''));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoToAdjust, setPhotoToAdjust] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({ senha_atual: '', nova_senha: '', confirmar_senha: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const syncUser = (updatedUser) => {
    login({ token, user: { ...user, ...updatedUser } });
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setFeedback('');
    setErrorMessage('');

    if (name.trim().length < 2 || phoneDigits(phone).length !== 11) {
      setErrorMessage('Informe seu nome e um telefone válido com DDD.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await updateAccount(user.id, {
        nome_completo: name.trim(),
        telefone: phoneDigits(phone),
      }, token);
      syncUser(updatedUser);
      setName(updatedUser.nome_completo || name.trim());
      setPhone(formatPhoneNumber(updatedUser.telefone || phone));
      setFeedback('Informações salvas.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível salvar as informações.'));
    } finally {
      setIsSaving(false);
    }
  };

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setFeedback('');
    setErrorMessage('');
    if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(file.type)) {
      setErrorMessage('Escolha uma imagem JPG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setErrorMessage('A imagem deve ter no máximo 5 MB.');
      return;
    }

    setPhotoToAdjust(file);
  };

  const saveAdjustedPhoto = async (file) => {
    setFeedback('');
    setErrorMessage('');
    setIsUploadingPhoto(true);
    try {
      const updatedUser = await uploadAccountPhoto(user.id, file, token);
      syncUser(updatedUser);
      setFeedback('Foto de perfil atualizada.');
      setPhotoToAdjust(null);
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível enviar a foto.'));
      return false;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setFeedback('');
    setErrorMessage('');

    if (passwordForm.nova_senha.length < 8) {
      setErrorMessage('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (passwordForm.nova_senha !== passwordForm.confirmar_senha) {
      setErrorMessage('A confirmação da nova senha não confere.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeAccountPassword(user.id, passwordForm, token);
      setPasswordForm({ senha_atual: '', nova_senha: '', confirmar_senha: '' });
      setFeedback('Senha alterada com sucesso.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível alterar a senha.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm(
      'Desativar sua conta? Seus serviços serão despublicados e você será desconectado.',
    );
    if (!confirmed) return;

    setErrorMessage('');
    setIsDeactivating(true);
    try {
      await deactivateAccount(user.id, token);
      logout();
      navigate(ROUTE_PATHS.login, {
        replace: true,
        state: { message: 'Sua conta foi desativada.' },
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível desativar sua conta.'));
      setIsDeactivating(false);
    }
  };

  return (
    <main className="account-settings-page">
      <header className="account-settings-header">
        <div>
          <h1>Configurações de Conta</h1>
          <p>Gerencie as informações do seu perfil e as opções da sua conta.</p>
        </div>
      </header>

      {feedback ? <p className="feedback feedback--success" role="status">{feedback}</p> : null}
      {errorMessage ? <p className="feedback feedback--danger" role="alert">{errorMessage}</p> : null}

      <div className="account-settings-grid">
        <div className="account-settings-column">
          <section className="card account-settings-panel">
            <div className="account-panel-heading">
              <div className="account-panel-title">
                <UserRound size={19} aria-hidden="true" />
                <h2>Informações do perfil</h2>
              </div>
            </div>

            <div className="account-photo-row">
              <img
                className="account-settings-avatar"
                src={user?.foto_perfil || PROFILE_PHOTO_PLACEHOLDER}
                alt=""
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = PROFILE_PHOTO_PLACEHOLDER;
                }}
              />
              <div className="account-photo-copy">
                <strong>Foto de perfil</strong>
                <p>JPG, PNG ou WebP. Máximo de 5 MB.</p>
                <label className="button button--secondary account-photo-button">
                  <Camera size={16} aria-hidden="true" />
                  {photoToAdjust ? 'Imagem selecionada' : 'Alterar foto'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={uploadPhoto}
                    disabled={isUploadingPhoto || Boolean(photoToAdjust)}
                  />
                </label>
              </div>
              <span className="account-role-badge">{user?.tipo_conta === 'PRESTADOR' ? 'Prestador' : 'Cliente'}</span>
            </div>

            <form id="account-profile-form" className="account-profile-form" onSubmit={saveProfile}>
              <label className="field">
                <span>Nome completo</span>
                <div className="account-editable-input">
                  <input value={name} onChange={(event) => setName(event.target.value)} required minLength="2" />
                  <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
                </div>
              </label>
              <label className="field">
                <span>Endereço de e-mail</span>
                <input type="email" value={user?.email || ''} readOnly />
              </label>
              <label className="field account-profile-form__phone">
                <span>Telefone</span>
                <div className="account-editable-input">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(formatPhoneNumber(event.target.value))}
                    placeholder="(11) 99999 - 9999"
                    inputMode="numeric"
                    required
                  />
                  <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
                </div>
              </label>
            </form>
            <button className="button button--primary account-save-button" type="submit" form="account-profile-form" disabled={isSaving}>
              <Check size={17} aria-hidden="true" />
              {isSaving ? 'Salvando...' : 'Salvar mudanças'}
            </button>
          </section>

          <section className="card account-settings-panel">
            <div className="account-panel-heading">
              <div className="account-panel-title">
                <Bell size={19} aria-hidden="true" />
                <h2>Preferências de notificação</h2>
              </div>
            </div>
            <div className="account-unavailable-state">
              <p>As preferências de notificação ainda não podem ser configuradas.</p>
            </div>
          </section>
        </div>

        <div className="account-settings-column">
          <section className="card account-settings-panel">
            <div className="account-panel-heading">
              <div className="account-panel-title">
                <LockKeyhole size={19} aria-hidden="true" />
                <h2>Segurança e credenciais</h2>
              </div>
            </div>
            <form className="account-password-form" onSubmit={changePassword}>
              <label className="field">
                <span>Senha atual</span>
                <input type="password" value={passwordForm.senha_atual} onChange={(event) => setPasswordForm((current) => ({ ...current, senha_atual: event.target.value }))} required autoComplete="current-password" />
              </label>
              <label className="field">
                <span>Nova senha</span>
                <input type="password" value={passwordForm.nova_senha} onChange={(event) => setPasswordForm((current) => ({ ...current, nova_senha: event.target.value }))} minLength="8" required autoComplete="new-password" />
              </label>
              <label className="field">
                <span>Repetir nova senha</span>
                <input type="password" value={passwordForm.confirmar_senha} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmar_senha: event.target.value }))} minLength="8" required autoComplete="new-password" />
              </label>
              <button className="button button--secondary" type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Alterando...' : 'Alterar senha'}
              </button>
            </form>
          </section>

          <section className="account-danger-zone">
            <div className="account-panel-title">
              <ShieldAlert size={19} aria-hidden="true" />
              <h2>Zona de perigo</h2>
            </div>
            <p>Desativar sua conta encerra o acesso e despublica os serviços associados. Esta ação não pode ser desfeita pelo aplicativo.</p>
            <button
              className="button button--danger"
              type="button"
              onClick={handleDeactivateAccount}
              disabled={isDeactivating}
            >
              <Trash2 size={16} aria-hidden="true" />
              {isDeactivating ? 'Desativando...' : 'Desativar minha conta'}
            </button>
          </section>
        </div>
      </div>
      {photoToAdjust ? (
        <ImageAdjustDialog
          file={photoToAdjust}
          kind="avatar"
          onClose={() => setPhotoToAdjust(null)}
          onSave={saveAdjustedPhoto}
          isSaving={isUploadingPhoto}
        />
      ) : null}
    </main>
  );
}