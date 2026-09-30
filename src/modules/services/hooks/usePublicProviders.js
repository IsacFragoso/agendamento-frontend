import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../core/http/http-error';
import { listProviders } from '../services/services.service';

export function usePublicProviders() {
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProviders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload = await listProviders();
      setProviders(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setProviders([]);
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar os profissionais cadastrados.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProviders();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadProviders]);

  return {
    errorMessage,
    isLoading,
    loadProviders,
    providers,
  };
}
