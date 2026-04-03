import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';

const menuItems = [
  { path: '/',            label: 'Dashboard',      icon: '📊' },
  { path: '/assets',     label: 'Tài sản',        icon: '📦' },
  { path: '/categories', label: 'Danh mục',       icon: '📁' },
  { path: '/locations',  label: 'Vị trí',         icon: '📍' },
  { path: '/suppliers',  label: 'Nhà cung cấp',   icon: '🏢' },
  { path: '/departments',label: 'Phòng ban',        icon: '👥' },
  { path: '/maintenance',label: 'Bảo trì',        icon: '🔧' },
{ path: '/inventory',  label: 'Kiểm kê',        icon: '📋' },
  { path: '/purchases', label: 'Đề xuất mua sắm', icon: '🛒', permission: 'MANAGE_PURCHASE_PROPOSALS' },
];

const adminMenuItems = [
  { path: '/users', label: 'Người dùng', icon: '👤', permission: 'MANAGE_USERS' },
  { path: '/roles', label: 'Phân quyền', icon: '🔐', permission: 'MANAGE_ROLES' },
];

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleAdminItems = adminMenuItems.filter(item => user?.permissions?.includes(item.permission));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* ── Sidebar ───────────────────────────────────── */}
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 34, height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
              boxShadow: '0 4px 10px rgba(37,99,235,0.4)'
            }}>
              🏛️
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Asset</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>Management</div>
            </div>
          </div>
        </div>
        

        {/* Menu section label */}
        <div style={{ padding: '16px 16px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
          Chính
        </div>

        {/* Navigation */}
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Admin section */}
        {visibleAdminItems.length > 0 && (
          <>
            <div style={{ padding: '16px 16px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
              Quản trị
            </div>
            <ul className="sidebar-menu" style={{ flex: 'none' }}>
              {visibleAdminItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={location.pathname === item.path ? 'active' : ''}
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
            <div className="name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Link to="/profile" style={{ color: 'inherit', textDecoration: 'none' }} title="Hồ sơ cá nhân">
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
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
          >
            🚪
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────── */}
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 999 }}>
          <NotificationBell />
        </div>

        {children}
      </main>
    </div>
  );
};

export default MainLayout;
