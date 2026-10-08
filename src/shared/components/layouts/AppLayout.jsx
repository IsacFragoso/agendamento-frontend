import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../../core/store/use-auth';
import './AppLayout.css';

export default function AppLayout({ menuItems, children }) {
  const { user } = useAuth();
  const hasSidebar = menuItems?.length > 0;

  return (
    <div className={`app-shell ${hasSidebar ? '' : 'app-shell--public'}`}>
      {hasSidebar ? (
        <aside className="app-sidebar">
          <div>
            <Link className="app-sidebar__brand" to="/explorar">
              <span className="app-sidebar__brand-mark">✦</span>
              <strong>SAPNE</strong>
            </Link>

            <nav className="app-sidebar__nav">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `app-sidebar__link ${isActive ? 'is-active' : ''}`}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="app-sidebar__footer">
            <span className="app-sidebar__avatar">{user?.nome_completo?.slice(0, 1) || 'S'}</span>
            <div>
              <strong>{user?.nome_completo}</strong>
              <p>{user?.tipo_conta === 'PRESTADOR' ? 'Prestador' : 'Cliente'}</p>
            </div>
          </div>
        </aside>
      ) : null}

      <div className="app-content">{children}</div>
    </div>
  );
}
