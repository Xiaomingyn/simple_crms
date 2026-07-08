import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/organizations', label: 'Organizations', icon: '🏢' },
  { to: '/contacts', label: 'Contacts', icon: '👤' },
  { to: '/deals', label: 'Deals', icon: '💰' },
  { to: '/pipeline', label: 'Pipeline', icon: '📋' },
];

export default function Layout() {
  return (
    <div className="app-layout">
      {/* Top Header — brand only */}
      <header className="app-header">
        <div className="header-brand">
          <h1 className="brand-title">Personal CRM</h1>
        </div>
      </header>

      <div className="app-body">
        {/* Left Sidebar Navigation */}
        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
