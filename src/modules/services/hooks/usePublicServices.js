import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../core/http/http-error';
import { listPublicServices } from '../services/services.service';

export function usePublicServices() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload = await listPublicServices();
      setServices(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setServices([]);
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar os serviços disponíveis.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadServices();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadServices]);

  return {
    errorMessage,
    isLoading,
    loadServices,
    services,
  };
}
