import './DashboardLayout.css';

export default function DashboardLayout({ children, activeMenu = 'Agenda', onSelectMenu }) {
  const menuItems = [
    { name: 'Início', icon: '🎛️' },
    { name: 'Agenda', icon: '📅' },
    { name: 'Histórico', icon: '🕒' },
    { name: 'Perfil', icon: '👤' },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Lateral */}
      <aside className="sidebar">
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activeMenu === item.name ? 'active' : ''}`}
              onClick={() => onSelectMenu?.(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Área Principal de Conteúdo */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}