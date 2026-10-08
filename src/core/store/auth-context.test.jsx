import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestHelper } from '../http/request-helper';
import { AuthProvider } from './auth-context';
import { useAuth } from './use-auth';

function SessionState({ onChange }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    onChange(isAuthenticated);
  }, [isAuthenticated, onChange]);

  return null;
}

describe('authenticated session expiration', () => {
  let container;
  let root;
  let onAuthChange;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    onAuthChange = vi.fn();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('clears the stored session after a token-authenticated request returns 401', async () => {
    localStorage.setItem('agendamento-web/session', JSON.stringify({
      token: 'expired-token',
      user: { id_usuario: 12, tipo_conta: 'CLIENTE' },
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Token expirado' }),
    }));

    await act(async () => {
      root.render(
        <AuthProvider>
          <SessionState onChange={onAuthChange} />
        </AuthProvider>,
      );
    });
    expect(onAuthChange).toHaveBeenLastCalledWith(true);

    await act(async () => {
      await expect(requestHelper('/agendamentos', { token: 'expired-token' }))
        .rejects.toMatchObject({ status: 401 });
    });

    expect(onAuthChange).toHaveBeenLastCalledWith(false);
    expect(localStorage.getItem('agendamento-web/session')).toBeNull();
  });
});