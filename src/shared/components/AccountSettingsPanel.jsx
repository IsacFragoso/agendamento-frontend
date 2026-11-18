import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../core/http/http-error';
import { ROUTE_PATHS } from '../../core/router/paths';
import { useAuth } from '../../core/store/use-auth';
import { deleteAccount, updateAccount, updatePassword } from '../services/account.service';
import './AccountSettingsPanel.css';

const INITIAL_PASSWORD = { senha_atual: '', nova_senha: '', confirmar_senha: '' };

export default function AccountSettingsPanel() {
  const navigate = useNavigate();
  const { logout, token, updateUser, user } = useAuth();
  const [profile, setProfile] = useState(() => ({
    nome_completo: user?.nome_completo || '',
    telefone: user?.telefone || '',
  }));
  const [password, setPassword] = useState(INITIAL_PASSWORD);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const saveProfile = async (event) => {
    event.preventDefault();
    const phone = profile.telefone.replace(/\D/g, '');

    if (phone && phone.length !== 11) {
      setErrorMessage('Informe um telefone com DDD e 11 dígitos.');
      return;
    }

    setIsSavingProfile(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      const payload = { nome_completo: profile.nome_completo.trim() };
      if (phone) payload.telefone = phone;
      const updated = await updateAccount(user.id, payload, token);
      updateUser(updated);
      setFeedbackMessage('Seus dados foram atualizados.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar seus dados.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setFeedbackMessage('');

    if (password.nova_senha !== password.confirmar_senha) {
      setErrorMessage('A confirmação da nova senha não confere.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await updatePassword(user.id, password, token);
      setPassword(INITIAL_PASSWORD);
      setFeedbackMessage('Senha alterada com sucesso.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível alterar a senha.'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const removeAccount = async () => {
    const confirmed = window.confirm('Excluir sua conta permanentemente? Essa ação não pode ser desfeita.');
    if (!confirmed) return;

    setErrorMessage('');
    try {
      await deleteAccount(user.id, token);
      logout();
      navigate(ROUTE_PATHS.marketplace, { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível excluir a conta.'));
    }
  };

  return (
    <section className="account-settings">
      <header className="account-settings__heading">
        <div>
          <p className="marketplace-kicker">Sua conta</p>
          <h1>Configurações</h1>
          <p>Atualize seus dados pessoais e credenciais de acesso.</p>
        </div>
      </header>

      {errorMessage ? <p className="feedback feedback--danger">{errorMessage}</p> : null}
      {feedbackMessage ? <p className="feedback feedback--success">{feedbackMessage}</p> : null}

      <div className="account-settings__grid">
        <form className="account-settings__panel" onSubmit={saveProfile}>
          <div className="account-settings__panel-heading">
            <span className="account-settings__icon">◎</span>
            <div><h2>Informações do perfil</h2><p>Seus dados de contato e identificação.</p></div>
          </div>
          <label className="field">
            <span>Nome completo</span>
            <input value={profile.nome_completo} onChange={(event) => setProfile((current) => ({ ...current, nome_completo: event.target.value }))} minLength="2" required />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input type="email" value={user?.email || ''} readOnly aria-readonly="true" />
            <small>O e-mail não pode ser alterado por esta tela.</small>
          </label>
          <label className="field">
            <span>Telefone</span>
            <input type="tel" inputMode="numeric" value={profile.telefone} onChange={(event) => setProfile((current) => ({ ...current, telefone: event.target.value }))} placeholder="11999999999" />
          </label>
          <button className="button button--primary" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </form>

        <form className="account-settings__panel" onSubmit={savePassword}>
          <div className="account-settings__panel-heading">
            <span className="account-settings__icon account-settings__icon--mint">⌑</span>
            <div><h2>Segurança e credenciais</h2><p>Use uma senha longa e exclusiva.</p></div>
          </div>
          <label className="field">
            <span>Senha atual</span>
            <input type="password" autoComplete="current-password" value={password.senha_atual} onChange={(event) => setPassword((current) => ({ ...current, senha_atual: event.target.value }))} required />
          </label>
          <label className="field">
            <span>Nova senha</span>
            <input type="password" autoComplete="new-password" minLength="8" value={password.nova_senha} onChange={(event) => setPassword((current) => ({ ...current, nova_senha: event.target.value }))} required />
          </label>
          <label className="field">
            <span>Repita a nova senha</span>
            <input type="password" autoComplete="new-password" minLength="8" value={password.confirmar_senha} onChange={(event) => setPassword((current) => ({ ...current, confirmar_senha: event.target.value }))} required />
          </label>
          <button className="button button--secondary" type="submit" disabled={isSavingPassword}>
            {isSavingPassword ? 'Atualizando...' : 'Alterar senha'}
          </button>
        </form>

        <section className="account-settings__danger">
          <div><h2>Excluir conta</h2><p>A conta será desativada e seus dados pessoais serão tratados conforme as regras do sistema.</p></div>
          <button className="button button--danger" type="button" onClick={removeAccount}>Excluir minha conta</button>
        </section>
      </div>
    </section>
  );
}