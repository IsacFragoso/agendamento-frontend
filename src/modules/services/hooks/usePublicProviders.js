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
      // DEBUG: log and normalize provider prices so we can verify what the frontend receives
      // eslint-disable-next-line no-console
      console.log('usePublicProviders raw payload:', payload);
      const normalized = Array.isArray(payload)
        ? payload.map((prov) => ({
            ...prov,
            servicos: Array.isArray(prov.servicos)
              ? prov.servicos.map((s) => ({ ...s, preco: s.preco == null ? null : Number(s.preco) }))
              : prov.servico
                ? [{ ...prov.servico, preco: prov.servico.preco == null ? null : Number(prov.servico.preco) }]
                : [],
            preco: prov.preco == null ? null : Number(prov.preco),
          }))
        : [];
      // eslint-disable-next-line no-console
      console.log('usePublicProviders normalized payload:', normalized);
      setProviders(normalized);
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
