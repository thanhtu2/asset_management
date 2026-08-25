import { changelog } from '../data/changelogData';

const typeConfig = {
  feature: { label: 'Tính năng mới', icon: '✨', color: '#2563eb', bg: '#eff6ff' },
  fix: { label: 'Sửa lỗi', icon: '🔧', color: '#d97706', bg: '#fffbeb' },
  security: { label: 'Bảo mật', icon: '🔒', color: '#dc2626', bg: '#fef2f2' },
};

const Changelog = () => {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Lịch sử cập nhật</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>
        Các thay đổi, tính năng mới và bản sửa lỗi qua từng phiên bản của hệ thống.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {changelog.map((release) => (
          <div key={release.version} style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: 20, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: -7,
                top: 4,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#2563eb',
                border: '2px solid white',
                boxShadow: '0 0 0 1px #2563eb',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>v{release.version}</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                {new Date(release.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {release.changes.map((change, idx) => {
                const cfg = typeConfig[change.type] || typeConfig.feature;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: cfg.color,
                        background: cfg.bg,
                        padding: '2px 8px',
                        borderRadius: 999,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                    <span style={{ fontSize: 13, color: '#374151', paddingTop: 1 }}>{change.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Changelog;