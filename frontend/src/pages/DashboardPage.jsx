import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../api';

/* Accent colour per stat card */
const STAT_CARDS = [
  { key: 'totalAssets',       label: 'Tổng số tài sản',  icon: '📦', accent: '#2563eb' },
  { key: 'newAssets',         label: 'Tài sản mới',       icon: '✨', accent: '#7c3aed' },
  { key: 'goodAssets',        label: 'Tài sản tốt',       icon: '✅', accent: '#10b981' },
  { key: 'needsRepairAssets', label: 'Cần sửa chữa',      icon: '🔧', accent: '#f59e0b' },
  { key: 'disposedAssets',    label: 'Đã thanh lý',       icon: '🗑️', accent: '#ef4444' },
  { key: 'totalValue',        label: 'Tổng giá trị',      icon: '💰', accent: '#0ea5e9', isValue: true },
];

const formatVND = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div style={{
          width: 36, height: 36,
          border: '3px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: 2 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>
            Tổng quan hệ thống quản lý tài sản
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="btn btn-outline btn-sm"
          title="Làm mới"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {STAT_CARDS.map(({ key, label, icon, accent, isValue }) => {
          const raw = stats?.[key] || 0;
          const display = isValue ? formatVND(raw) : raw;
          return (
            <div key={key} className="stat-card" style={{ '--stat-accent': accent }}>
              <div style={{
                position: 'absolute', top: 16, right: 16,
                width: 40, height: 40, borderRadius: 10,
                background: accent + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {icon}
              </div>
              <h3>{label}</h3>
              <div
                className="value"
                style={{
                  fontSize: isValue ? (String(display).length > 12 ? 16 : 20) : 32,
                  color: accent,
                  marginTop: 8,
                }}
              >
                {display}
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {[
          { title: 'Theo danh mục',  data: stats?.assetsByCategory,   nameKey: 'name',   fallback: 'Chưa phân loại' },
          { title: 'Theo phòng ban',   data: stats?.assetsByDepartment, nameKey: 'name',   fallback: 'Chưa gán' },
          { title: 'Theo vị trí',    data: stats?.byLocation,        nameKey: 'name',   fallback: 'Chưa xác định' },
        ].map(({ title, data, nameKey, fallback }) => (
          <div key={title} className="card">
            <div className="card-header">
              <h3 className="card-title">{title}</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th style={{ textAlign: 'right' }}>Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.length > 0
                    ? data.map((item, index) => (
                        <tr key={index}>
                          <td>{item[nameKey] || fallback}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              minWidth: 28, height: 22, borderRadius: 6,
                              background: '#eff6ff', color: '#2563eb',
                              fontSize: 12, fontWeight: 600,
                            }}>
                              {item.count}
                            </span>
                          </td>
                        </tr>
                      ))
                    : (
                      <tr>
                        <td colSpan="2" style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Maintenance */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3 className="card-title">
            <span style={{ marginRight: 6 }}>🔔</span>
            Bảo trì sắp tới
          </h3>
          <Link to="/maintenance" className="btn btn-sm btn-outline">Xem tất cả →</Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tài sản</th>
                <th>Ngày bảo trì</th>
                <th>Loại</th>
                <th>Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {stats?.upcomingMaintenance?.length > 0
                ? stats.upcomingMaintenance.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.asset_name}</td>
                      <td>
                        <span style={{
                          background: '#fef3c7', color: '#92400e',
                          padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500
                        }}>
                          {new Date(item.next_maintenance_date).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td>
                        {item.maintenance_type === 'preventive' ? 'Định kỳ'
                          : item.maintenance_type === 'corrective' ? 'Sửa chữa'
                          : 'Khẩn cấp'}
                      </td>
                      <td style={{ color: '#64748b', fontSize: 13 }}>{item.description}</td>
                    </tr>
                  ))
                : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      Không có bảo trì sắp tới
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
