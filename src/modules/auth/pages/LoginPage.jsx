import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from '../../../core/router/paths';
import { useAuthActions } from '../hooks/useAuthActions';

const INITIAL_LOGIN_FORM = {
  email: '',
  senha: '',
};

const INITIAL_REGISTER_FORM = {
  email: '',
  senha: '',
  confirmSenha: '',
};

const stats = [
  { value: '12k+', label: 'Profissionais Verificados' },
  { value: '98.4%', label: 'Taxa de satisfação' },
];

const BoltIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M13 2L4 13h6l-1 9 9-11h-6l1-9Z" fill="currentColor" />
  </svg>
);

export default function LoginPage() {
  const location = useLocation();
  const { errorMessage, isSubmitting, submitLogin, submitRegister } = useAuthActions();
  const [mode, setMode] = useState('register');
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN_FORM);
  const [registerForm, setRegisterForm] = useState(INITIAL_REGISTER_FORM);
  const [registerError, setRegisterError] = useState('');

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    await submitLogin(loginForm);
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    if (registerForm.senha !== registerForm.confirmSenha) {
      setRegisterError('As senhas não conferem.');
      return;
    }

    setRegisterError('');
    const nomeComEmail = registerForm.email.split('@')[0] || 'Usuário';

    await submitRegister({
      nome_completo: nomeComEmail,
      email: registerForm.email,
      senha: registerForm.senha,
      tipo_conta: 'CLIENTE',
    });
  };

  const isRegisterMode = mode === 'register';

  return (
    <main className="auth-shell">
      <aside className="auth-hero">
        <div className="auth-brand">
          <span className="auth-brand__mark">
            <BoltIcon />
          </span>
          <span className="auth-brand__text">SAPNE</span>
        </div>

        <div className="auth-hero__copy">
          <h1>Profissionais de qualidade, a um clique de distância.</h1>
          <p>
            Agende cortes de cabelo, manutenções, consultas e aulas particulares com especialistas locais
            certificados, de forma instantânea.
          </p>
        </div>

        <div className="auth-stats">
          {stats.map((item) => (
            <div key={item.label} className="auth-stat">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </aside>

      <section className="auth-form-panel">
        <div className="auth-form-box">
          <h2>{isRegisterMode ? 'Crie sua conta' : 'Entrar'}</h2>
          <p className="auth-form-box__subtitle">
            {isRegisterMode
              ? 'Conecte-se a especialistas locais de confiança ou gerencie sua empresa local hoje mesmo.'
              : 'Conecte-se aos especialistas locais de confiança e acesse sua conta hoje mesmo.'}
          </p>

          <div className="auth-toggle" role="tablist" aria-label="Escolha entre cadastro e login">
            <div
              className="auth-toggle__indicator"
              style={{ transform: isRegisterMode ? 'translateX(0%)' : 'translateX(100%)' }}
            />
            <button
              type="button"
              className={`auth-toggle__button ${isRegisterMode ? 'is-active' : ''}`}
              onClick={() => setMode('register')}
            >
              Cadastre-se
            </button>
            <button
              type="button"
              className={`auth-toggle__button ${!isRegisterMode ? 'is-active' : ''}`}
              onClick={() => setMode('login')}
            >
              Entrar
            </button>
          </div>

          {location.state?.message ? <p className="feedback feedback--success">{location.state.message}</p> : null}
          {errorMessage ? <p className="feedback feedback--danger">{errorMessage}</p> : null}
          {registerError ? <p className="feedback feedback--danger">{registerError}</p> : null}

          {isRegisterMode ? (
            <form className="form-stack" onSubmit={handleRegisterSubmit}>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="seunome@exemplo.com"
                  required
                />
              </label>

              <label className="field">
                <span>Senha</span>
                <input
                  type="password"
                  value={registerForm.senha}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, senha: event.target.value }))}
                  placeholder="••••••••••••"
                  required
                />
              </label>

              <label className="field">
                <span>Confirme sua senha</span>
                <input
                  type="password"
                  value={registerForm.confirmSenha}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, confirmSenha: event.target.value }))}
                  placeholder="••••••••••••"
                  required
                />
              </label>

              <button className="button button--primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </form>
          ) : (
            <form className="form-stack" onSubmit={handleLoginSubmit}>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="seunome@exemplo.com"
                  required
                />
              </label>

              <label className="field">
                <span>Senha</span>
                <input
                  type="password"
                  value={loginForm.senha}
                  onChange={(event) => setLoginForm((current) => ({ ...current, senha: event.target.value }))}
                  placeholder="••••••••••••"
                  required
                />
              </label>

              <button className="button button--primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

        </div>
      </section>
    </main>
  );
}
