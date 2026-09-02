import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from '../../../core/router/paths';
import { useAuthActions } from '../hooks/useAuthActions';

const INITIAL_FORM = {
  email: '',
  senha: '',
};

export default function LoginPage() {
  const location = useLocation();
  const { errorMessage, isSubmitting, submitLogin } = useAuthActions();
  const [formValues, setFormValues] = useState(INITIAL_FORM);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitLogin(formValues);
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <span className="eyebrow">Acesso</span>
        <h1>Entrar no painel</h1>
        <p className="auth-card__subtitle">Acesse sua conta para gerenciar agenda, serviços e agendamentos.</p>

        {location.state?.message ? <p className="feedback feedback--success">{location.state.message}</p> : null}
        {errorMessage ? <p className="feedback feedback--danger">{errorMessage}</p> : null}

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              value={formValues.email}
              onChange={(event) => setFormValues((current) => ({ ...current, email: event.target.value }))}
              placeholder="voce@empresa.com"
              required
            />
          </label>

          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={formValues.senha}
              onChange={(event) => setFormValues((current) => ({ ...current, senha: event.target.value }))}
              placeholder="Sua senha"
              required
            />
          </label>

          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="auth-card__footer">
          Ainda não tem conta? <Link to={ROUTE_PATHS.register}>Cadastre-se</Link>
        </p>
      </section>
    </div>
  );
}
