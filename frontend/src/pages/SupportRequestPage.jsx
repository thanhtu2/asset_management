import { useEffect, useState } from 'react';
import { assetsAPI, supportRequestsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_LABELS = {
  hardware: 'Phần cứng', software: 'Phần mềm', network: 'Mạng/kết nối',
  account: 'Tài khoản', peripheral: 'Thiết bị ngoại vi', other: 'Khác'
};
const STATUS_LABELS = {
  submitted: 'Mới gửi', assigned: 'Đã tiếp nhận', in_progress: 'Đang xử lý',
  waiting_user: 'Chờ người dùng', resolved: 'Đã sửa xong - chờ xác nhận', closed: 'Đã đóng',
  rejected: 'Từ chối', cancelled: 'Đã hủy'
};
const PRIORITY_LABELS = { low: 'Thấp', normal: 'Bình thường', high: 'Cao', urgent: 'Khẩn cấp' };
const STATUS_CLASSES = { submitted: 'badge-pending', assigned: 'badge-new', in_progress: 'badge-new', waiting_user: 'badge-needs_repair', resolved: 'badge-good', closed: 'badge-good', rejected: 'badge-disposed', cancelled: 'badge-disposed' };

const SupportRequestPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: '', status: '', priority: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [form, setForm] = useState({ title: '', description: '', category: 'hardware', priority: 'normal', asset_id: '' });
  const canProcess = user?.role === 'admin' || user?.permissions?.includes('PROCESS_SUPPORT_REQUEST');

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsResponse, assetsResponse] = await Promise.all([
        supportRequestsAPI.getAll({ ...filters, page: pagination.page, limit: pagination.limit }),
        assetsAPI.getAllSimple()
      ]);
      setRequests(requestsResponse.data?.data || []);
      const responsePagination = requestsResponse.data?.pagination;
      if (responsePagination) {
        setPagination(prev => ({
          ...prev,
          total: responsePagination.total ?? prev.total,
          totalPages: responsePagination.totalPages ?? prev.totalPages
        }));
      }
      const assetData = assetsResponse.data?.data || assetsResponse.data?.assets || assetsResponse.data || [];
      setAssets(Array.isArray(assetData) ? assetData : []);
    } catch (error) {
      console.error('Không thể tải yêu cầu hỗ trợ:', error);
      setRequests([]);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    setPagination(prev => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [filters.status, filters.category, filters.priority, filters.search]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  const handleLimitChange = (limit) => {
    setPagination(prev => ({ ...prev, limit: Number(limit), page: 1 }));
  };

  const openCreate = () => {
    setForm({ title: '', description: '', category: 'hardware', priority: 'normal', asset_id: '' });
    setShowCreate(true);
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await supportRequestsAPI.create({ ...form, asset_id: form.asset_id || null });
      setShowCreate(false);
      setPagination(prev => ({ ...prev, page: 1 }));
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể tạo phiếu hỗ trợ');
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (request) => {
    try {
      const response = await supportRequestsAPI.getById(request.id);
      setSelected(response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể tải chi tiết phiếu');
    }
  };

  const updateRequest = async (status, extras = {}) => {
    if (!selected) return;

    const finalComment = status === 'closed'
      ? (extras.comment ?? window.prompt('Nhập ghi chú xác nhận khi đóng phiếu (bắt buộc):', ''))
      : (extras.comment ?? window.prompt('Ghi chú xử lý (không bắt buộc):', ''));

    if (finalComment === null) return;
    if (status === 'closed' && !String(finalComment).trim()) {
      alert('Vui lòng nhập ghi chú xác nhận khi đóng phiếu.');
      return;
    }

    const assignedTo = extras.assigned_to !== undefined
      ? extras.assigned_to
      : (selected.assigned_to ?? (status === 'assigned' || status === 'in_progress' || status === 'resolved' ? user?.id : null));

    setSaving(true);
    try {
      const response = await supportRequestsAPI.update(selected.id, {
        status,
        comment: finalComment,
        assigned_to: assignedTo,
        ...(extras.resolution_summary !== undefined ? { resolution_summary: extras.resolution_summary } : {}),
        ...(extras.resolution_cost !== undefined ? { resolution_cost: extras.resolution_cost } : {})
      });
      setSelected(response.data);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể cập nhật phiếu');
    } finally {
      setSaving(false);
    }
  };

  const canUserConfirmClosure = user?.id === selected?.requester_id && selected?.status === 'resolved';

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="support-request-page" style={{ padding: '0 20px', marginBottom: 30 }}>
      <div className="page-header">
        <div>
          <h1>Yêu cầu hỗ trợ kỹ thuật</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Tiếp nhận và theo dõi các sự cố phần cứng, phần mềm</p>
        </div>
        {user?.role === 'admin' || user?.permissions?.includes('CREATE_SUPPORT_REQUEST') ? (
          <button className="btn btn-primary" onClick={openCreate}>+ Tạo phiếu hỗ trợ</button>
        ) : null}
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-box"><input value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} placeholder="Tìm mã phiếu, tiêu đề, nội dung..." onKeyDown={event => event.key === 'Enter' && setPagination(prev => ({ ...prev, page: 1 }))} /></div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={filters.category} onChange={event => setFilters({ ...filters, category: event.target.value })}><option value="">Tất cả nhóm lỗi</option>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">Tất cả trạng thái</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={filters.priority} onChange={event => setFilters({ ...filters, priority: event.target.value })}><option value="">Tất cả mức độ</option>{Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <button className="btn btn-outline" onClick={loadData}>Làm mới</button>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Mã phiếu</th><th>Tiêu đề</th><th>Nhóm lỗi</th><th>Ưu tiên</th><th>Người gửi</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
            <tbody>{requests.map(request => <tr key={request.id}>
              <td>{request.request_number}</td><td className="col-long-text">{request.title}</td><td>{CATEGORY_LABELS[request.category] || request.category}</td><td>{PRIORITY_LABELS[request.priority] || request.priority}</td><td>{request.requester_name || '-'}</td><td><span className={`badge ${STATUS_CLASSES[request.status] || 'badge-pending'}`}>{STATUS_LABELS[request.status] || request.status}</span></td><td>{new Date(request.created_at).toLocaleDateString('vi-VN')}</td><td><button className="btn btn-sm btn-outline" onClick={() => openDetails(request)}>Chi tiết</button></td>
            </tr>)}{requests.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center' }}>Chưa có phiếu hỗ trợ</td></tr>}</tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} bản ghi
          </div>
          <div className="pagination-controls">
            <select value={pagination.limit} onChange={event => handleLimitChange(event.target.value)} className="pagination-limit">
              <option value="10">10 / trang</option>
              <option value="20">20 / trang</option>
              <option value="50">50 / trang</option>
            </select>
            <div className="pagination-buttons">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="btn btn-sm">«</button>
              <span className="pagination-page-info">Trang {pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="btn btn-sm">»</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && <div className="modal-overlay"><div className="modal">
        <div className="modal-header"><h2>Tạo phiếu hỗ trợ kỹ thuật</h2><button className="btn btn-sm btn-outline" onClick={() => setShowCreate(false)}>&times;</button></div>
        <form onSubmit={submitCreate}><div className="modal-body">
          <div className="form-group"><label>Tiêu đề *</label><input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required maxLength="255" placeholder="Ví dụ: Máy tính không khởi động" /></div>
          <div className="form-row"><div className="form-group"><label>Nhóm lỗi *</label><select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="form-group"><label>Mức độ ưu tiên</label><select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}>{Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
          <div className="form-group"><label>Tài sản liên quan</label><select value={form.asset_id} onChange={event => setForm({ ...form, asset_id: event.target.value })}><option value="">Không gắn tài sản</option>{assets.map(asset => <option key={asset.id} value={asset.id}>{asset.asset_code} - {asset.name}</option>)}</select></div>
          <div className="form-group"><label>Mô tả chi tiết *</label><textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} required rows="5" placeholder="Mô tả sự cố, thời điểm phát sinh và ảnh hưởng..." /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Hủy</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Đang gửi...' : 'Gửi phiếu'}</button></div></form>
      </div></div>}

      {selected && <div className="modal-overlay"><div className="modal modal-lg">
        <div className="modal-header"><h2>{selected.request_number}</h2><button className="btn btn-sm btn-outline" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="modal-body"><div className="detail-grid"><div className="detail-item full-width"><label>Tiêu đề</label><span>{selected.title}</span></div><div className="detail-item"><label>Nhóm lỗi</label><span>{CATEGORY_LABELS[selected.category]}</span></div><div className="detail-item"><label>Ưu tiên</label><span>{PRIORITY_LABELS[selected.priority]}</span></div><div className="detail-item"><label>Người gửi</label><span>{selected.requester_name || '-'}</span></div><div className="detail-item"><label>Người xử lý</label><span>{selected.assignee_name || 'Chưa tiếp nhận'}</span></div><div className="detail-item full-width"><label>Mô tả</label><span>{selected.description}</span></div></div><div style={{ marginTop: 24 }}><h3 style={{ marginBottom: 12 }}>Lịch sử xử lý</h3>{selected.history?.map(item => <div key={item.id} style={{ borderLeft: '3px solid #2563eb', padding: '8px 12px', marginBottom: 8, background: '#f8fafc' }}><strong>{item.actor_name || 'Hệ thống'}</strong><div style={{ fontSize: 12, color: '#64748b' }}>{item.old_status ? `${STATUS_LABELS[item.old_status]} → ` : ''}{STATUS_LABELS[item.new_status] || item.action} · {new Date(item.created_at).toLocaleString('vi-VN')}</div>{item.comment && <div style={{ marginTop: 4 }}>{item.comment}</div>}</div>)}</div></div>
        {(canProcess || canUserConfirmClosure) && !['closed', 'cancelled', 'rejected'].includes(selected.status) && (
          <div className="modal-footer">
            {canProcess && (
              <>
                {selected.status !== 'assigned' && selected.status !== 'in_progress' && selected.status !== 'resolved' && (
                  <button className="btn btn-outline" disabled={saving} onClick={() => updateRequest('assigned')}>Tiếp nhận</button>
                )}
                {selected.status !== 'in_progress' && selected.status !== 'resolved' && (
                  <button className="btn btn-primary" disabled={saving} onClick={() => updateRequest('in_progress')}>Bắt đầu xử lý</button>
                )}
                {selected.status !== 'resolved' && (
                  <button className="btn btn-success" disabled={saving} onClick={() => updateRequest('resolved')}>Xác nhận sửa xong</button>
                )}
              </>
            )}
            {canUserConfirmClosure && (
              <button className="btn btn-secondary" disabled={saving} onClick={() => updateRequest('closed')}>Xác nhận và đóng phiếu</button>
            )}
          </div>
        )}
      </div></div>}
    </div>
  );
};

export default SupportRequestPage;
