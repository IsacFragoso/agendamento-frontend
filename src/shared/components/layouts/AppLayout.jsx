import { Fragment } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BriefcaseBusiness, CalendarDays, Clock3, Compass, LayoutDashboard, Settings, User } from 'lucide-react';
import { useAuth } from '../../../core/store/use-auth';
import { getClientPath, getProviderPath, ROUTE_PATHS } from '../../../core/router/paths';
import BrandLogo from '../BrandLogo';
import ThemeToggle from '../ThemeToggle';
import AppHeader from './AppHeader';
import { handleProfilePhotoError, PROFILE_PHOTO_PLACEHOLDER } from '../../utils/profile-photo';
import './AppLayout.css';

const MARKETPLACE_MENU_ITEM = { label: 'Explorar', Icon: Compass, to: ROUTE_PATHS.marketplace };

const CLIENT_MENU_ITEMS = [
  MARKETPLACE_MENU_ITEM,
  { label: 'Agendamentos', Icon: CalendarDays, to: getClientPath('agendamentos') },
  { label: 'Histórico', Icon: Clock3, to: getClientPath('historico') },
  { label: 'Configurações', Icon: Settings, to: ROUTE_PATHS.settings },
];

const PROVIDER_MENU_ITEMS = [
  MARKETPLACE_MENU_ITEM,
  { label: 'Dashboard', Icon: LayoutDashboard, to: ROUTE_PATHS.dashboard },
  { label: 'Agenda', Icon: CalendarDays, to: getProviderPath('agenda') },
  { label: 'Portfólio', Icon: BriefcaseBusiness, to: ROUTE_PATHS.providerPortfolio },
  { label: 'Histórico', Icon: Clock3, to: getProviderPath('historico') },
  { label: 'Configurações', Icon: Settings, to: ROUTE_PATHS.settings },
];

const GUEST_MENU_ITEMS = [MARKETPLACE_MENU_ITEM];

export default function AppLayout() {
  const { isAuthenticated, user } = useAuth();
  const menuItems = !isAuthenticated
    ? GUEST_MENU_ITEMS
    : user?.tipo_conta === 'PRESTADOR' ? PROVIDER_MENU_ITEMS : CLIENT_MENU_ITEMS;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <BrandLogo variant="sidebar" subtitle="Painel operacional" />

        <nav className="app-sidebar__nav">
          {menuItems.map((item, index) => (
            <Fragment key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `app-sidebar__link ${isActive ? 'is-active' : ''}`}
              >
                <item.Icon size={18} strokeWidth={2} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
              {index === 0 ? <span className="app-sidebar__divider" aria-hidden="true" /> : null}
            </Fragment>
          ))}
        </nav>

        <div className="app-sidebar__bottom">
          <div className="app-sidebar__theme">
            <span>Aparência</span>
            <ThemeToggle variant="switch" />
          </div>
          {isAuthenticated ? (
            <Link
              className="app-sidebar__footer"
              to={ROUTE_PATHS.settings}
              aria-label={`Configurações da conta de ${user?.nome_completo || 'usuário'}`}
            >
              <img
                className="app-sidebar__avatar"
                src={user?.foto_perfil || PROFILE_PHOTO_PLACEHOLDER}
                alt=""
                onError={handleProfilePhotoError}
              />
              <div className="app-sidebar__user-info">
                <strong>{user?.nome_completo}</strong>
                <p>{user?.tipo_conta}</p>
              </div>
            </Link>
          ) : (
            <div className="app-sidebar__visitor">
              <div className="app-sidebar__visitor-head">
                <span className="app-sidebar__avatar app-sidebar__avatar--visitor"><User size={20} aria-hidden="true" /></span>
                <div className="app-sidebar__user-info">
                  <strong>Visitante</strong>
                  <p>Acesse sua conta</p>
                </div>
              </div>
              <Link className="button button--primary" to={ROUTE_PATHS.login}>Entrar</Link>
              <Link className="app-sidebar__visitor-secondary" to={ROUTE_PATHS.register}>Criar conta</Link>
            </div>
          )}
        </div>
      </aside>

      <main className="app-content">
        <AppHeader />
        <Outlet />
      </main>
    </div>
  );
}
