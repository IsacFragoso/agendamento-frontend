import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import { ROUTE_PATHS } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import './AppHeader.css';

const THEME_STORAGE_KEY = 'agendamento-web/theme';

const getStoredTheme = () => {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export default function AppHeader() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      return undefined;
    }
    return undefined;
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate(ROUTE_PATHS.login, { replace: true });
  };

  return (
    <header className="app-header">
      <div className="app-header__actions">
        <button
          className="app-header__theme"
          type="button"
          aria-label={`Ativar modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
          aria-pressed={theme === 'dark'}
          onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        >
          {theme === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
        </button>
      <button className="app-header__logout" type="button" onClick={handleLogout}>
        <LogOut size={17} strokeWidth={2} aria-hidden="true" />
        <span>Sair</span>
      </button>
      </div>
    </header>
  );
}