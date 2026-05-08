import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';

const SIDEBAR_WIDTH = 256;

const menuItems = [
  { path: '/',             label: 'Dashboard',         icon: '📊' },
  { path: '/assets',       label: 'Tài sản',           icon: '📦' },
  { path: '/categories',   label: 'Danh mục',          icon: '📁' },
  { path: '/locations',    label: 'Vị trí',            icon: '📍' },
  { path: '/suppliers',    label: 'Nhà cung cấp',      icon: '🏢' },
  { path: '/departments',  label: 'Phòng ban',         icon: '👥' },
  { path: '/maintenance',  label: 'Bảo trì',           icon: '🔧' },
  { path: '/inventory',    label: 'Kiểm kê',           icon: '📋' },
  { path: '/purchases',    label: 'Đề xuất mua sắm',   icon: '🛒', permission: 'MANAGE_PURCHASE_PROPOSALS' },
];

const adminMenuItems = [
  { path: '/users',       label: 'Người dùng',        icon: '👤', permission: 'MANAGE_USERS' },
  { path: '/roles',       label: 'Phân quyền',        icon: '🔐', permission: 'MANAGE_ROLES' },
  { path: '/audit-logs',  label: 'Lịch sử hệ thống', icon: '📝', permission: 'MANAGE_USERS' },
];

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const visibleAdminItems = adminMenuItems.filter(
    item => user?.permissions?.includes(item.permission)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* ── Nút floating thu nhỏ/mở rộng sidebar (chỉ desktop) ── */}
      <button
        onClick={() => setCollapsed(p => !p)}
        title={collapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
        style={{
          position: 'fixed',
          top: '50%',
          left: collapsed ? 0 : SIDEBAR_WIDTH,
          transform: 'translateY(-50%)',
          zIndex: 999,
          width: 20,
          height: 48,
          background: 'white',
          border: '1px solid var(--color-border)',
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1), background 0.15s',
          padding: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#f8fafc';
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }}
        className="sidebar-float-toggle"
      >
        {collapsed ? '›' : '‹'}
      </button>

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}
        style={{
          width: collapsed ? 0 : SIDEBAR_WIDTH,
          minWidth: collapsed ? 0 : SIDEBAR_WIDTH,
          overflow: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Logo */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
              boxShadow: '0 4px 10px rgba(37,99,235,0.4)',
            }}>
              🏛️
            </div>
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Asset</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>Management</div>
            </div>
          </div>
        </div>

        {/* Section: Chính */}
        <div style={{ padding: '16px 16px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Chính
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ whiteSpace: 'nowrap' }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Section: Quản trị */}
        {visibleAdminItems.length > 0 && (
          <>
            <div style={{ padding: '16px 16px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Quản trị
            </div>
            <ul className="sidebar-menu" style={{ flex: 'none' }}>
              {visibleAdminItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={location.pathname === item.path ? 'active' : ''}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* User Info */}
        <div className="user-info">
          <div className="avatar">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="details">
            <div className="name" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Link
                to="/profile"
                style={{ color: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap' }}
                title="Hồ sơ cá nhân"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {user?.fullName} ⚙️
              </Link>
            </div>
            <div className="role">{user?.role_name || user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: 'rgba(255,255,255,0.55)',
              cursor: 'pointer',
              width: 30, height: 30,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
              flexShrink: 0,
              transition: 'all 0.2s',
              marginLeft: 6,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
              e.currentTarget.style.color = '#fca5a5';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            🚪
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main
        className="main-content"
        style={{
          marginLeft: collapsed ? 0 : SIDEBAR_WIDTH,
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, position: 'relative', zIndex: 999 }}>
          {/* Hamburger Mobile */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            style={{ display: 'none' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div style={{ marginLeft: 'auto' }}>
            <NotificationBell />
          </div>
        </div>

        {children}
      </main>
    </div>
  );
};

export default MainLayout;
