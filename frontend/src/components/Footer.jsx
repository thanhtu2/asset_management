import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const ENVIRONMENT = import.meta.env.MODE; // 'development' | 'production'

const Footer = () => {
  const { user } = useAuth();
  const [systemStatus, setSystemStatus] = useState({ online: true, lastBackup: null, uptime: null });

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/system/status`, { credentials: 'include' });
        const data = await res.json();
        if (mounted) setSystemStatus({ online: true, lastBackup: data.lastBackup, uptime: data.uptime });
      } catch {
        if (mounted) setSystemStatus(prev => ({ ...prev, online: false }));
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // 60s
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <footer style={{ background: '#f9fafb', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 24,
          padding: '20px 24px',
        }}
      >
        {/* Giới thiệu */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: '#0f1729',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              🏛️
            </div>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Asset Management</span>
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
            Hệ thống quản lý tài sản nội bộ MBS.
          </p>
        </div>

        {/* Liên kết */}
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 10 }}>
            Liên kết
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            <Link to="/user-guide" style={{ color: '#6b7280', textDecoration: 'none' }}>📖 Hướng dẫn sử dụng</Link>
            <Link to="/changelog" style={{ color: '#6b7280', textDecoration: 'none' }}>🕒 Lịch sử cập nhật</Link>
            <Link to="/privacy-policy" style={{ color: '#6b7280', textDecoration: 'none' }}>🔒 Chính sách bảo mật</Link>
          </div>
        </div>

        {/* Hỗ trợ */}
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 10 }}>
            Hỗ trợ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#6b7280' }}>
            <div>☎️ Văn phòng - Bộ phận CNTT</div>
          </div>
        </div>

        {/* Trạng thái hệ thống */}
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 10 }}>
            Trạng thái hệ thống
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: systemStatus.online ? '#16a34a' : '#dc2626' }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: systemStatus.online ? '#16a34a' : '#dc2626',
                }}
              />
              {systemStatus.online ? 'Máy chủ hoạt động ổn định' : 'Không thể kết nối máy chủ'}
            </div>
            {/* Chỉ admin mới thấy thông tin hạ tầng chi tiết */}
            {isAdmin && systemStatus.lastBackup && (
              <div style={{ color: '#6b7280' }}>Sao lưu gần nhất: {systemStatus.lastBackup}</div>
            )}
            {isAdmin && systemStatus.uptime && (
              <div style={{ color: '#6b7280' }}>Uptime: {systemStatus.uptime}</div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderTop: '1px solid var(--color-border)',
          fontSize: 11,
          color: '#9ca3af',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ textAlign: 'center', flex: 1 }}>
          {new Date().getFullYear()} Asset Management. Bảo lưu mọi quyền.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Phiên bản v{APP_VERSION}</span>
          {/* Chỉ admin mới thấy môi trường đang chạy, tránh lộ thông tin hạ tầng cho user thường */}
          {isAdmin && (
            <>
              <span>·</span>
              <span>Môi trường: {ENVIRONMENT === 'production' ? 'Production' : 'Staging'}</span>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;