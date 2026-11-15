import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from '../../../core/router/paths';
import { getErrorMessage } from '../../../core/http/http-error';
import BrandLogo from '../../../shared/components/BrandLogo';
import ThemeToggle from '../../../shared/components/ThemeToggle';
import { requestPasswordReset, resetPassword } from '../services/auth.service';

export default function PasswordRecoveryPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setMessage('');
    if (token && password !== confirmation) {
      setErrorMessage('As senhas não conferem.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = token
        ? await resetPassword({ token, nova_senha: password })
        : await requestPasswordReset(email);
      setMessage(response?.message || 'Solicitação concluída.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível concluir a solicitação.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell auth-shell--account">
      <aside className="auth-hero">
        <BrandLogo variant="auth" />
        <div className="auth-hero__copy">
          <h1>Recupere o acesso à sua conta.</h1>
          <p>Enviaremos instruções para o e-mail cadastrado.</p>
        </div>
      </aside>
      <ThemeToggle className="theme-toggle--floating" />
      <section className="auth-form-panel">
        <div className="auth-form-box">
          <h2>{token ? 'Redefinir senha' : 'Recuperar senha'}</h2>
          <p className="auth-form-box__subtitle">
            {token ? 'Escolha uma nova senha com pelo menos 8 caracteres.' : 'Informe o e-mail usado no seu cadastro.'}
          </p>
          {message ? <p className="feedback feedback--success" role="status">{message}</p> : null}
          {errorMessage ? <p className="feedback feedback--danger" role="alert">{errorMessage}</p> : null}
          {!message ? (
            <form className="form-stack" onSubmit={submit}>
              {token ? (
                <>
                  <label className="field"><span>Nova senha</span><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                  <label className="field"><span>Confirmar nova senha</span><input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
                </>
              ) : (
                <label className="field"><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seunome@exemplo.com" /></label>
              )}
              <button className="button button--primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Aguarde...' : token ? 'Salvar nova senha' : 'Enviar instruções'}
              </button>
            </form>
          ) : null}
          <p className="auth-card__footer"><Link to={ROUTE_PATHS.login}>Voltar para entrar</Link></p>
        </div>
      </section>
    </main>
  );
}
