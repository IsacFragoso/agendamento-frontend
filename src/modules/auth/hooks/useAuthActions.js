import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../../core/http/http-error';
import { ROUTE_PATHS, getDashboardPathForAccountType } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { loginUser, registerUser } from '../services/auth.service';

export function useAuthActions() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorPayload, setErrorPayload] = useState(null);

  const submitLogin = async (values) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setErrorPayload(null);

    try {
      const payload = await loginUser(values);
      auth.login({ token: payload.access_token, user: payload.usuario });
      navigate(getDashboardPathForAccountType(payload?.usuario?.tipo_conta), { replace: true });
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Falha ao realizar login.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRegister = async (values) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setErrorPayload(null);

    try {
      const payload = await registerUser(values);
      navigate(ROUTE_PATHS.login, {
        replace: true,
        state: {
          message: payload?.mensagem || 'Conta criada com sucesso. Faça login para continuar.',
        },
      });
      return { succeeded: true };
    } catch (error) {
      setErrorPayload(error?.payload || null);
      setErrorMessage(getErrorMessage(error, 'Não foi possível criar a conta.'));
      return { succeeded: false, errorPayload: error?.payload || null };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    errorMessage,
    errorPayload,
    isSubmitting,
    submitLogin,
    submitRegister,
  };
}
