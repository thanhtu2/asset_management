import { useState, useEffect } from 'react';
import { auditLogsAPI } from '../api';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, pagination.limit]);

  const fetchLogs = async () => {
    try {
      const response = await auditLogsAPI.getAll({ page: pagination.page, limit: pagination.limit });
      setLogs(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getActionBadge = (action) => {
    const colors = {
      'CREATE': 'badge-new',
      'UPDATE': 'badge-good',
      'DELETE': 'badge-disposed',
      'LOGIN': 'badge-pending',
    };
    return <span className={`badge ${colors[action] || 'badge-pending'}`}>{action}</span>;
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lịch sử hệ thống (Audit Logs)</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Theo dõi mọi hoạt động thay đổi dữ liệu của người dùng</p>
        </div>
        <button onClick={fetchLogs} className="btn btn-outline">🔄 Làm mới</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người dùng</th>
                <th>Thao tác</th>
                <th>Đối tượng</th>
                <th>Mô tả chi tiết</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                  <td style={{ fontWeight: 500 }}>{log.user_name || log.username || 'Hệ thống'}</td>
                  <td>{getActionBadge(log.action)}</td>
                  <td><span style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}</span></td>
                  <td style={{ color: '#475569' }}>{log.description}</td>
                  <td style={{ fontSize: '12px', color: '#94a3b8' }}>{log.ip_address || '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center'}}>Không có lịch sử</td></tr>}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} bản ghi
            </div>
            <div className="pagination-controls">
              <div className="pagination-buttons">
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="btn btn-sm">«</button>
                <span className="pagination-page-info">Trang {pagination.page} / {pagination.totalPages}</span>
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="btn btn-sm">»</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AuditLogPage;