import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { ROUTE_PATHS } from '../../../core/router/paths';
import { getErrorMessage } from '../../../core/http/http-error';
import ThemeToggle from '../../../shared/components/ThemeToggle';
import { requestEmailVerification, verifyEmail } from '../services/auth.service';

export default function EmailVerificationPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') || '';
  const pendingEmail = location.state?.email || '';
  const [email, setEmail] = useState(pendingEmail);
  const [message, setMessage] = useState(location.state?.message || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(Boolean(token));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    let ignore = false;

    verifyEmail(token)
      .then((response) => {
        if (!ignore) {
          setMessage(response?.message || 'E-mail confirmado com sucesso.');
        }
      })
      .catch((error) => {
        if (!ignore) {
          setErrorMessage(getErrorMessage(error, 'Não foi possível confirmar o e-mail.'));
        }
      })
      .finally(() => {
        if (!ignore) setIsVerifying(false);
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  const resend = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const response = await requestEmailVerification(email);
      setMessage(response?.message || 'Novo link de confirmação solicitado.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível reenviar o e-mail.'));
    } finally {
      setIsSubmitting(false);
    }
  };
  const isPendingRegistration = Boolean(pendingEmail) && !token;

  return (
    <main className="email-verification-page">
      <ThemeToggle className="theme-toggle--floating" />
      <section className="email-verification-card" aria-labelledby="email-verification-title">
        <div className="email-verification-card__icon" aria-hidden="true">
          <MailCheck size={30} />
        </div>
        <div className="email-verification-card__heading">
          <h1 id="email-verification-title">
            {isPendingRegistration ? 'Confirme seu cadastro' : 'Verificação de e-mail'}
          </h1>
        </div>

        {isVerifying ? (
          <p className="feedback" role="status">Confirmando seu e-mail...</p>
        ) : null}
        {message ? <p className="feedback feedback--success" role="status">{message}</p> : null}
        {errorMessage ? <p className="feedback feedback--danger" role="alert">{errorMessage}</p> : null}

        {!isVerifying && (!message || isPendingRegistration) ? (
          <form className="form-stack email-verification-card__form" onSubmit={resend}>
            <p className="email-verification-card__subtitle">
              {isPendingRegistration
                ? `Enviamos um link de confirmação para ${pendingEmail}.`
                : 'Informe seu e-mail para receber um novo link de confirmação.'}
            </p>
            {!isPendingRegistration ? (
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seunome@exemplo.com"
                />
              </label>
            ) : null}
            <button className="button button--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Reenviar confirmação'}
            </button>
          </form>
        ) : null}

        {message && !isPendingRegistration ? (
          <p className="email-verification-card__footer">
            <Link to={ROUTE_PATHS.login}>Ir para entrar</Link>
          </p>
        ) : (
          <p className="email-verification-card__footer">
            <Link to={ROUTE_PATHS.login}>Voltar para entrar</Link>
          </p>
        )}
      </section>
    </main>
  );
}
