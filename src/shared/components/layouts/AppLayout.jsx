import { Link, NavLink, Outlet } from 'react-router-dom';
import { BriefcaseBusiness, CalendarDays, Clock3, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '../../../core/store/use-auth';
import { getClientPath, getProviderPath, ROUTE_PATHS } from '../../../core/router/paths';
import BrandLogo from '../BrandLogo';
import AppHeader from './AppHeader';
import './AppLayout.css';

const PROFILE_PHOTO_PLACEHOLDER = '/images/user-placeholder.jpg';

const handleProfilePhotoError = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = PROFILE_PHOTO_PLACEHOLDER;
};

const CLIENT_MENU_ITEMS = [
  { label: 'Dashboard', Icon: LayoutDashboard, to: ROUTE_PATHS.dashboard },
  { label: 'Agendamentos', Icon: CalendarDays, to: getClientPath('agenda') },
  { label: 'Histórico', Icon: Clock3, to: getClientPath('historico') },
  { label: 'Configurações', Icon: Settings, to: ROUTE_PATHS.settings },
];

const PROVIDER_MENU_ITEMS = [
  { label: 'Dashboard', Icon: LayoutDashboard, to: ROUTE_PATHS.dashboard },
  { label: 'Agenda', Icon: CalendarDays, to: getProviderPath('agenda') },
  { label: 'Portfólio', Icon: BriefcaseBusiness, to: ROUTE_PATHS.providerPortfolio },
  { label: 'Histórico', Icon: Clock3, to: getProviderPath('historico') },
  { label: 'Configurações', Icon: Settings, to: ROUTE_PATHS.settings },
];

export default function AppLayout() {
  const { user } = useAuth();
  const menuItems = user?.tipo_conta === 'PRESTADOR' ? PROVIDER_MENU_ITEMS : CLIENT_MENU_ITEMS;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <BrandLogo variant="sidebar" subtitle="Painel operacional" />

        <nav className="app-sidebar__nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `app-sidebar__link ${isActive ? 'is-active' : ''}`}
            >
              <item.Icon size={18} strokeWidth={2} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

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
      </aside>

      <main className="app-content">
        <AppHeader />
        <Outlet />
      </main>
    </div>
  );
}
