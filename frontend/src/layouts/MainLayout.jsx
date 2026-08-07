import { useState, useRef, useEffect } from 'react';
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdownId) => {
    setOpenDropdowns(prev => ({ ...prev, [dropdownId]: !prev[dropdownId] }));
  };

  const hasPermission = (item) => {
    if (user?.role === 'admin') return true;
    if (Array.isArray(item.permissions)) {
      return item.permissions.some(p => user?.permissions?.includes(p));
    }
    if (item.permission) return user?.permissions?.includes(item.permission);
    return true;
  };

  const filterVisibleItems = (items) => {
    return items.map(item => {
      if (item.children) {
        const visibleChildren = item.children.filter(hasPermission);
        return visibleChildren.length > 0 ? { ...item, children: visibleChildren } : null;
      }
      return hasPermission(item) ? item : null;
    }).filter(Boolean);
  };

  const visibleMenuItems = filterVisibleItems(menuItems);
  const visibleAdminItems = filterVisibleItems(adminMenuItems);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsUserMenuOpen(false);
  };

  return (
    <div className="app-container">
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

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

      <aside
        className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}
        style={{
          width: collapsed ? 0 : SIDEBAR_WIDTH,
          position: 'fixed',
          top: 0,
          left: 0,
          minWidth: collapsed ? 0 : SIDEBAR_WIDTH,
          overflow: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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

          <div className="sidebar-scroll-area" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
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

          {/* User Info with Dropdown */}
          <div className="user-info-container" ref={userMenuRef} style={{ position: 'relative', flexShrink: 0, padding: '16px' }}>
            <div 
              className="user-info" 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                padding: '8px', 
                borderRadius: '8px',
                background: isUserMenuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              <div className="avatar" style={{ flexShrink: 0 }}>
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="details" style={{ marginLeft: '10px', overflow: 'hidden' }}>
                <div className="name" style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.fullName}
                </div>
                <div className="role" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                  {(() => {
                    const roleMap = {
                      'admin': 'Quản trị viên',
                      'director': 'Giám đốc',
                      'vice-director': 'Phó Giám đốc',
                      'department-leader': 'Trưởng phòng',
                      'vice-department-leader': 'Phó Trưởng phòng',
                      'department-office': 'Chánh Văn phòng',
                      'vice-department-office': 'Phó Chánh Văn phòng',
                      'manager': 'Quản lý tài sản',
                      'purchase-requester': 'Người đề xuất mua sắm',
                      'user': 'Người dùng'
                    };
                    return roleMap[user?.role] || user?.role || '';
                  })()}
                </div>
              </div>
              <IconChevronRight style={{ marginLeft: 'auto', transform: isUserMenuOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }} />
            </div>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '16px',
                right: '16px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                marginBottom: '8px',
                zIndex: 1000,
                color: '#333'
              }}>
                <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} style={{ display: 'block', padding: '10px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>
                  👤 Hồ sơ cá nhân
                </Link>
                <button onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'none', padding: '10px 16px', textAlign: 'left', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main
        className="main-content"
        style={{
          marginLeft: collapsed ? 0 : SIDEBAR_WIDTH,
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, position: 'relative', zIndex: 999 }}>
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