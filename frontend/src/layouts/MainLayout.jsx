import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';

// Icon cho dropdown
const IconChevronRight = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const SIDEBAR_WIDTH = 256;

const menuItems = [
  { path: '/',             label: 'Dashboard',         icon: '📊' },
  {
    id: 'management',
    label: 'Quản lý',
    icon: '📦',
    children: [
      { path: '/assets',       label: 'Tài sản',           icon: '📦' },
      { path: '/categories',   label: 'Danh mục',          icon: '📁' },
      { path: '/locations',    label: 'Vị trí',            icon: '📍' },
      { path: '/suppliers',    label: 'Nhà cung cấp',      icon: '🏢' },
      { path: '/departments',  label: 'Phòng ban',         icon: '👥' },
    ]
  },
  { path: '/maintenance',  label: 'Bảo trì',           icon: '🔧' },
  { path: '/inventory',    label: 'Kiểm kê',           icon: '📋' },
  { path: '/purchases',    label: 'Đề xuất mua sắm',   icon: '🛒', permission: 'MANAGE_PURCHASE_PROPOSALS' },
  { path: '/vehicle-registrations', label: 'Lịch đăng ký xe', icon: '🚗', permissions: ['VIEW_VEHICLE_REGISTRATIONS', 'VIEW_VEHICLE_WEEKLY'] },
];

const adminMenuItems = [
  {
    id: 'admin',
    label: 'Quản trị',
    icon: '🛡️',
    children: [
      { path: '/users',       label: 'Người dùng',        icon: '👤', permission: 'MANAGE_USERS' },
      { path: '/roles',       label: 'Phân quyền',        icon: '🔐', permission: 'MANAGE_ROLES' },
      { path: '/audit-logs',  label: 'Lịch sử hệ thống', icon: '📝', permission: 'MANAGE_USERS' },
    ]
  }
];

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (dropdownId) => {
    setOpenDropdowns(prev => ({ ...prev, [dropdownId]: !prev[dropdownId] }));
  };

  const hasPermission = (item) => {
    if (user?.role === 'admin') return true;
    // Sửa đổi: Cho phép kiểm tra một mảng các quyền
    if (Array.isArray(item.permissions)) {
      return item.permissions.some(p => user?.permissions?.includes(p));
    }
    if (item.permission) return user?.permissions?.includes(item.permission);
    return true; // Không yêu cầu quyền (ví dụ: Dashboard)
  };

  const filterVisibleItems = (items) => {
    return items.map(item => {
      // Nếu là mục cha (có children)
      if (item.children) {
        // Lọc ra các mục con mà user có quyền xem
        const visibleChildren = item.children.filter(hasPermission);
        // Chỉ trả về mục cha nếu nó có ít nhất một mục con có thể xem được
        return visibleChildren.length > 0 ? { ...item, children: visibleChildren } : null;
      }
      // Nếu là mục đơn, chỉ cần kiểm tra quyền của chính nó
      return hasPermission(item) ? item : null;
    }).filter(Boolean);
  };

  const visibleMenuItems = filterVisibleItems(menuItems);
  const visibleAdminItems = filterVisibleItems(adminMenuItems);

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
          position: 'fixed', // Ghim cố định sidebar
          top: 0,
          left: 0,
          minWidth: collapsed ? 0 : SIDEBAR_WIDTH,
          overflow: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <div className="sidebar-header" style={{ flexShrink: 0 }}>
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

          {/* Scrollable Menu Area */}
          <div className="sidebar-scroll-area" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {/* Section: Chính */}
            <div style={{ padding: '16px 16px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Chính
            </div>

            <ul className="sidebar-menu">
              {visibleMenuItems.map((item) => {
                if (item.children) {
                  return (
                    <li key={item.id} className={`sidebar-dropdown ${openDropdowns[item.id] ? 'open' : ''}`}>
                      <a
                        href="#"
                        className="dropdown-toggle"
                        onClick={(e) => { e.preventDefault(); toggleDropdown(item.id); }}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <IconChevronRight className="dropdown-arrow" />
                      </a>
                      <ul className="dropdown-menu">
                        {item.children.map(child => (
                          <li key={child.path}>
                            <Link to={child.path} className={location.pathname === child.path ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                }
                return (
                  <li key={item.path}>
                    <Link to={item.path} className={location.pathname === item.path ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)} style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Section: Quản trị */}
            {visibleAdminItems.length > 0 && (
              <>
                <div style={{ padding: '16px 16px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Quản trị
                </div>
                <ul className="sidebar-menu">
                  {visibleAdminItems.map((item) => {
                    if (item.children) {
                      return (
                        <li key={item.id} className={`sidebar-dropdown ${openDropdowns[item.id] ? 'open' : ''}`}>
                          <a
                            href="#"
                            className="dropdown-toggle"
                            onClick={(e) => { e.preventDefault(); toggleDropdown(item.id); }}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: 16 }}>{item.icon}</span>
                              <span>{item.label}</span>
                            </div>
                            <IconChevronRight className="dropdown-arrow" />
                          </a>
                          <ul className="dropdown-menu">
                            {item.children.map(child => (
                              <li key={child.path}>
                                <Link to={child.path} className={location.pathname === child.path ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    }
                    return (
                      <li key={item.path}>
                        <Link to={item.path} className={location.pathname === item.path ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)} style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            
            {/* Section: Trợ giúp */}
            <div style={{ padding: '16px 16px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Trợ giúp
            </div>
            <ul className="sidebar-menu">
                <li>
                    <Link to="/user-guide" className={location.pathname === '/user-guide' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)} style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 16 }}>📖</span>
                      <span>Hướng dẫn sử dụng</span>
                    </Link>
                </li>
            </ul>
          </div>

          {/* User Info */}
          <div className="user-info" style={{ flexShrink: 0 }}>
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