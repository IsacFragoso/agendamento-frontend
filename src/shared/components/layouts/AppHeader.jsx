import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { ROUTE_PATHS } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import LocationIndicator from '../LocationIndicator';
import './AppHeader.css';

export default function AppHeader({ showBrand = false }) {
  const navigate = useNavigate();
  const { pathname, key } = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const canGoBack = Boolean(matchPath({ path: ROUTE_PATHS.providerProfile, end: false }, pathname));

  const handleLogout = () => {
    logout();
    navigate(ROUTE_PATHS.login, { replace: true });
  };

  const handleBack = () => {
    if (key === 'default') {
      navigate(ROUTE_PATHS.marketplace);
      return;
    }
    navigate(-1);
  };

  return (
    <header className={`app-header ${showBrand ? 'app-header--with-brand' : ''}`}>
      <div className="app-header__start">
        {canGoBack ? (
          <button className="app-header__back" type="button" onClick={handleBack} aria-label="Voltar" title="Voltar">
            <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
        {showBrand ? (
          <Link className="app-header__brand" to={ROUTE_PATHS.marketplace} aria-label="SAPNE, início">
            <span className="app-header__brand-mark">✦</span>
            <span>SAPNE</span>
          </Link>
        ) : null}
      </div>
      <div className="app-header__actions">
        <LocationIndicator />
        {isAuthenticated ? (
          <button className="app-header__logout" type="button" onClick={handleLogout}>
            <LogOut size={17} strokeWidth={2} aria-hidden="true" />
            <span>Sair</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}