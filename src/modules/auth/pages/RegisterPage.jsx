import { useState } from 'react';
import { Link } from 'react-router-dom';
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

const INITIAL_FORM = {
  nome_completo: '',
  email: '',
  telefone: '',
  senha: '',
  tipo_conta: 'PRESTADOR',
};

export default function RegisterPage() {
  const { errorMessage, isSubmitting, submitRegister } = useAuthActions();
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [phoneError, setPhoneError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!PHONE_PATTERN.test(formValues.telefone)) {
      setPhoneError('Informe o telefone no formato (xx) xxxxx - xxxx.');
      return;
    }

    setPhoneError('');
    await submitRegister({
      ...formValues,
      telefone: normalizePhoneNumber(formValues.telefone),
    });
  };

  const updateField = (fieldName, value) => {
    setFormValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
  };

  const handlePhoneChange = (value) => {
    updateField('telefone', formatPhoneNumber(value));

    if (phoneError) {
      setPhoneError('');
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <span className="eyebrow">Cadastro</span>
        <h1>Criar conta</h1>
        <p className="auth-card__subtitle">Cadastre prestadores e clientes usando o mesmo fluxo da API atual.</p>

        {errorMessage ? <p className="feedback feedback--danger">{errorMessage}</p> : null}
        {phoneError ? <p className="feedback feedback--danger">{phoneError}</p> : null}

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nome completo</span>
            <input value={formValues.nome_completo} onChange={(event) => updateField('nome_completo', event.target.value)} required />
          </label>

          <label className="field">
            <span>E-mail</span>
            <input type="email" value={formValues.email} onChange={(event) => updateField('email', event.target.value)} required />
          </label>

          <label className="field">
            <span>Telefone</span>
            <input
              value={formValues.telefone}
              onChange={(event) => handlePhoneChange(event.target.value)}
              placeholder="(11) 99999 - 9999"
              inputMode="numeric"
              maxLength="17"
              required
            />
          </label>

          <label className="field">
            <span>Senha</span>
            <input type="password" value={formValues.senha} onChange={(event) => updateField('senha', event.target.value)} required />
          </label>

          <label className="field">
            <span>Tipo de conta</span>
            <select value={formValues.tipo_conta} onChange={(event) => updateField('tipo_conta', event.target.value)}>
              <option value="PRESTADOR">Prestador</option>
              <option value="CLIENTE">Cliente</option>
            </select>
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
