import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth-context-instance';

const STORAGE_KEY = 'agendamento-web/session';

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    id: user.id || user.id_usuario || user.idUsuario || null,
    tipo_conta: String(user.tipo_conta || user.tipoConta || '').toUpperCase(),
  };
};

const loadStoredSession = () => {
  try {
    const rawSession = window.localStorage.getItem(STORAGE_KEY);

    if (!rawSession) {
      return { token: null, user: null };
    }

    const parsedSession = JSON.parse(rawSession);

    return {
      token: parsedSession?.token || null,
      user: normalizeUser(parsedSession?.user),
    };
  } catch {
    return { token: null, user: null };
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadStoredSession);

  useEffect(() => {
    if (session.token && session.user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  const value = useMemo(() => ({
    token: session.token,
    user: session.user,
    isAuthenticated: Boolean(session.token && session.user),
    login: (nextSession) => {
      setSession({
        token: nextSession?.token || nextSession?.access_token || null,
        user: normalizeUser(nextSession?.user || nextSession?.usuario),
      });
    },
    logout: () => setSession({ token: null, user: null }),
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
