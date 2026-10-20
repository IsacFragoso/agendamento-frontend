import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import './ThemeToggle.css';

const THEME_STORAGE_KEY = 'agendamento-web/theme';

const getStoredTheme = () => {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export default function ThemeToggle({ className = '', variant = 'icon' }) {
  const [theme, setTheme] = useState(getStoredTheme);
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      return undefined;
    }
    return undefined;
  }, [theme]);

  const label = `Ativar modo ${isDark ? 'claro' : 'escuro'}`;
  const currentTheme = isDark ? 'Escuro' : 'Claro';

  return (
    <button
      className={`theme-toggle ${variant === 'switch' ? 'theme-toggle--switch' : ''} ${className}`.trim()}
      type="button"
      role={variant === 'switch' ? 'switch' : undefined}
      aria-label={variant === 'switch' ? `Tema atual: ${currentTheme}` : label}
      title={variant === 'switch' ? `Alternar tema (atual: ${currentTheme})` : label}
      aria-checked={variant === 'switch' ? isDark : undefined}
      aria-pressed={variant === 'icon' ? isDark : undefined}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {variant === 'switch' ? (
        <span className="theme-toggle__thumb" aria-hidden="true">
          {isDark ? <Moon size={15} /> : <Sun size={15} />}
        </span>
      ) : (
        isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );
}
