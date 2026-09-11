import { useEffect, useState } from 'react';
import { changelogsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { changelog as fallbackChangelog } from '../data/changelogData';

const typeConfig = {
  feature: { label: 'Tính năng mới', icon: '✨', color: '#2563eb', bg: '#eff6ff' },
  fix: { label: 'Sửa lỗi', icon: '🔧', color: '#d97706', bg: '#fffbeb' },
  security: { label: 'Bảo mật', icon: '🔒', color: '#dc2626', bg: '#fef2f2' },
};

const toFallbackReleases = () => fallbackChangelog.map((release, index) => ({
  id: `fallback-${index}`,
  version: release.version,
  release_date: release.date,
  title: `Phiên bản ${release.version}`,
  changes: release.changes
}));

const Changelog = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.permissions?.includes('MANAGE_USERS');
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ version: '', release_date: new Date().toISOString().slice(0, 10), title: '', type: 'feature', description: '' });

  const loadChangelog = async () => {
    try {
      const response = await changelogsAPI.getAll();
      const rows = response.data?.data || [];
      const fallbackReleases = toFallbackReleases();
      const knownVersions = new Set(rows.map(release => release.version));
      setReleases([
        ...rows,
        ...fallbackReleases.filter(release => !knownVersions.has(release.version))
      ].sort((a, b) => new Date(b.release_date || b.date) - new Date(a.release_date || a.date)));
    } catch (error) {
      setReleases(toFallbackReleases());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadChangelog(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ version: '', release_date: new Date().toISOString().slice(0, 10), title: '', type: 'feature', description: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editing) await changelogsAPI.update(editing, form);
      else await changelogsAPI.create(form);
      resetForm();
      await loadChangelog();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể lưu lịch sử cập nhật.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bản cập nhật này?')) return;
    try {
      await changelogsAPI.delete(id);
      await loadChangelog();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xóa lịch sử cập nhật.');
    }
  };

  const startEdit = (release) => {
    setEditing(release.id);
    setForm({ version: release.version, release_date: release.release_date, title: release.title, type: release.type || 'feature', description: release.description || '' });
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Lịch sử cập nhật</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>
        Các thay đổi, tính năng mới và bản sửa lỗi qua từng phiên bản của hệ thống.
      </p>

      {canManage && (
        <form onSubmit={handleSubmit} style={{ padding: 20, marginBottom: 32, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 16px' }}>{editing ? 'Chỉnh sửa cập nhật' : 'Thêm lịch cập nhật'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input required placeholder="Phiên bản, ví dụ 1.3.0" value={form.version} onChange={event => setForm({ ...form, version: event.target.value })} />
            <input required type="date" value={form.release_date} onChange={event => setForm({ ...form, release_date: event.target.value })} />
            <input required placeholder="Tiêu đề cập nhật" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} />
            <select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}>
              <option value="feature">Tính năng mới</option>
              <option value="fix">Sửa lỗi</option>
              <option value="security">Bảo mật</option>
            </select>
          </div>
          <textarea required placeholder="Mô tả nội dung cập nhật" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} style={{ width: '100%', minHeight: 90, marginTop: 12, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary">{editing ? 'Lưu thay đổi' : 'Thêm cập nhật'}</button>
            {editing && <button type="button" className="btn btn-outline" onClick={resetForm}>Hủy</button>}
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {!loading && releases.map((release) => {
          const changes = release.changes || [{ type: release.type, text: release.description }];
          return (
          <div key={release.id || release.version} style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: 20, position: 'relative' }}>
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
                {new Date(release.release_date || release.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{release.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {changes.map((change, idx) => {
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
            {canManage && !String(release.id).startsWith('fallback-') && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-sm btn-outline" onClick={() => startEdit(release)}>Sửa</button>
                <button className="btn btn-sm btn-outline" onClick={() => handleDelete(release.id)}>Xóa</button>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default Changelog;