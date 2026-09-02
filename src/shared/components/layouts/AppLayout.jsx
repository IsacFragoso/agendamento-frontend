import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../core/store/use-auth';
import './AppLayout.css';

export default function AppLayout({ menuItems, children }) {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">
          <span className="app-sidebar__brand-mark">A+</span>
          <div>
            <strong>Agendamento</strong>
            <p>Painel operacional</p>
          </div>
        </div>

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

        <div className="app-sidebar__footer">
          <strong>{user?.nome_completo}</strong>
          <p>{user?.tipo_conta}</p>
        </div>
      </aside>

      <main className="app-content">{children}</main>
    </div>
  );
}
