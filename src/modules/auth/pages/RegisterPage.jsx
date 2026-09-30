import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { ROUTE_PATHS } from '../../../core/router/paths';
import { useAuthActions } from '../hooks/useAuthActions';

const PHONE_DIGIT_LIMIT = 11;
const PHONE_PATTERN = /^\(\d{2}\) \d{5} - \d{4}$/;

const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, PHONE_DIGIT_LIMIT);

  if (!digits) {
    return '';
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)} - ${digits.slice(7, 11)}`;
};

const normalizePhoneNumber = (value) => value.replace(/\D/g, '');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mapServerFieldErrors = (payload) => {
  const messages = Array.isArray(payload?.message)
    ? payload.message
    : [payload?.message].filter(Boolean);
  const errors = {};

  messages.forEach((message) => {
    const normalized = String(message).toLowerCase();
    if (normalized.includes('email') || normalized.includes('e-mail')) {
      errors.email = normalized.includes('cadastrad')
        ? 'Este e-mail já está cadastrado. Tente entrar ou use outro e-mail.'
        : 'Confira se o e-mail está escrito corretamente.';
    } else if (normalized.includes('telefone') || normalized.includes('phone')) {
      errors.telefone = 'Informe um telefone válido com DDD e 11 números.';
    } else if (normalized.includes('senha') || normalized.includes('password')) {
      errors.senha = 'A senha precisa ter pelo menos 8 caracteres.';
    }
  });

  return errors;
};

const INITIAL_FORM = {
  email: '',
  telefone: '',
  senha: '',
  repetirSenha: '',
};

export default function RegisterPage() {
  const { isSubmitting, submitRegister } = useAuthActions();
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatedPassword, setShowRepeatedPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!formValues.email.trim()) {
      nextErrors.email = 'Informe seu e-mail.';
    } else if (!EMAIL_PATTERN.test(formValues.email.trim())) {
      nextErrors.email = 'Digite um e-mail válido. Exemplo: nome@email.com.';
    }
    if (!formValues.senha) {
      nextErrors.senha = 'Informe uma senha.';
    } else if (formValues.senha.length < 8) {
      nextErrors.senha = 'A senha precisa ter pelo menos 8 caracteres.';
    }
    if (!formValues.repetirSenha) {
      nextErrors.repetirSenha = 'Digite a senha novamente para confirmá-la.';
    } else if (formValues.senha !== formValues.repetirSenha) {
      nextErrors.repetirSenha = 'As senhas não coincidem. Confira os dois campos.';
    }
    if (!PHONE_PATTERN.test(formValues.telefone)) {
      nextErrors.telefone = 'Informe um telefone válido com DDD e 11 números.';
    }

    setFieldErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    const result = await submitRegister({
      email: formValues.email,
      senha: formValues.senha,
      telefone: normalizePhoneNumber(formValues.telefone),
    });

    if (!result.succeeded) {
      const serverErrors = mapServerFieldErrors(result.errorPayload);
      setFieldErrors(serverErrors);
      if (Object.keys(serverErrors).length === 0) {
        setFormError('Não foi possível criar sua conta. Confira os dados e tente novamente.');
      }
    }
  };

  const updateField = (fieldName, value) => {
    setFormValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
    setFieldErrors((current) => ({ ...current, [fieldName]: '' }));
    setFormError('');
  };

  const handlePhoneChange = (value) => {
    updateField('telefone', formatPhoneNumber(value));
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-card__topbar">
          <span className="eyebrow">Cadastro</span>
          <Link
            className="auth-back-button"
            to={ROUTE_PATHS.login}
            aria-label="Voltar para a tela inicial de login"
            title="Voltar para a tela inicial"
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </Link>
        </div>
        <h1>Criar conta</h1>
        <p className="auth-card__subtitle">Crie sua conta para encontrar profissionais e agendar serviços.</p>

        {formError ? <p className="feedback feedback--danger" role="alert">{formError}</p> : null}

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              autoComplete="email"
              value={formValues.email}
              onChange={(event) => updateField('email', event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
              required
            />
            {fieldErrors.email ? <small className="field-error" id="register-email-error" role="alert">{fieldErrors.email}</small> : null}
          </label>

          <div className="field">
            <label htmlFor="register-password">Senha</label>
            <div className="password-input-wrap">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formValues.senha}
                onChange={(event) => updateField('senha', event.target.value)}
                minLength="8"
                aria-invalid={Boolean(fieldErrors.senha)}
                aria-describedby={fieldErrors.senha ? 'register-password-error' : undefined}
                required
              />
              <button
                className="password-visibility-toggle"
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
              </button>
            </div>
            {fieldErrors.senha ? <small className="field-error" id="register-password-error" role="alert">{fieldErrors.senha}</small> : null}
          </div>

          <div className="field">
            <label htmlFor="register-repeat-password">Repetir senha</label>
            <div className="password-input-wrap">
              <input
                id="register-repeat-password"
                type={showRepeatedPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formValues.repetirSenha}
                onChange={(event) => {
                  updateField('repetirSenha', event.target.value);
                  setFieldErrors((current) => ({ ...current, repetirSenha: '' }));
                  setFormError('');
                }}
                aria-invalid={Boolean(fieldErrors.repetirSenha)}
                aria-describedby={fieldErrors.repetirSenha ? 'register-confirm-password-error' : undefined}
                required
              />
              <button
                className="password-visibility-toggle"
                type="button"
                aria-label={showRepeatedPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showRepeatedPassword}
                onClick={() => setShowRepeatedPassword((visible) => !visible)}
              >
                {showRepeatedPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
              </button>
            </div>
            {fieldErrors.repetirSenha ? <small className="field-error" id="register-confirm-password-error" role="alert">{fieldErrors.repetirSenha}</small> : null}
          </div>

          <label className="field">
            <span>Telefone</span>
            <input
              type="tel"
              autoComplete="tel"
              value={formValues.telefone}
              onChange={(event) => handlePhoneChange(event.target.value)}
              placeholder="(11) 99999 - 9999"
              inputMode="numeric"
              maxLength="17"
              aria-invalid={Boolean(fieldErrors.telefone)}
              aria-describedby={fieldErrors.telefone ? 'register-phone-error' : undefined}
              required
            />
            {fieldErrors.telefone ? <small className="field-error" id="register-phone-error" role="alert">{fieldErrors.telefone}</small> : null}
          </label>

          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="auth-card__footer">
          Já possui conta? <Link to={ROUTE_PATHS.login}>Voltar para login</Link>
        </p>
      </section>
    </div>
  );
}
