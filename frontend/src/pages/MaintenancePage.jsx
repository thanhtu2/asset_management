import { useState, useEffect } from 'react';
import { maintenanceAPI, assetsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const MaintenancePage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    asset_id: '',
    maintenance_date: '',
    maintenance_type: 'preventive',
    description: '',
    cost: 0,
    technician: '',
    next_maintenance_date: ''
  });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [filter, setFilter] = useState({ asset_id: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, assetsRes] = await Promise.all([
        maintenanceAPI.getAll(filter),
        assetsAPI.getAllSimple()
      ]);
      // Handle paginated response
      setRecords(recordsRes.data?.data || recordsRes.data || []);
      setAssets(assetsRes.data?.data || assetsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleOpenModal = (record = null) => {
    if (record) {
      setEditData(record);
      setFormData({
        asset_id: record.asset_id,
        maintenance_date: record.maintenance_date,
        maintenance_type: record.maintenance_type,
        description: record.description || '',
        cost: record.cost || 0,
        technician: record.technician || '',
        next_maintenance_date: record.next_maintenance_date || ''
      });
    } else {
      setEditData(null);
      setFormData({
        asset_id: '',
        maintenance_date: new Date().toISOString().split('T')[0],
        maintenance_type: 'preventive',
        description: '',
        cost: 0,
        technician: '',
        next_maintenance_date: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        asset_id: parseInt(formData.asset_id)
      };

      if (editData) {
        await maintenanceAPI.update(editData.id, data);
      } else {
        await maintenanceAPI.create(data);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving maintenance:', error);
      alert(error.response?.data?.message || 'Không thể lưu bảo trì');
    }
  };

  const handleDelete = async () => {
    try {
      await maintenanceAPI.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null });
      fetchData();
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      alert('Không thể xóa bản ghi này');
    }
  };

  const handleCompleteRepair = async (record) => {
    if (!window.confirm(`Hoàn thành sửa chữa cho tài sản "${record.asset_name}"?\n\nTrạng thái tài sản sẽ được chuyển thành "Tốt".`)) {
      return;
    }
    try {
      await maintenanceAPI.completeRepair({ 
        asset_id: record.asset_id,
        maintenance_id: record.id
      });
      alert('Đã hoàn thành sửa chữa!');
      fetchData();
    } catch (error) {
      console.error('Error completing repair:', error);
      alert(error.response?.data?.message || 'Không thể hoàn thành sửa chữa');
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      preventive: 'Định kỳ',
      corrective: 'Sửa chữa',
      emergency: 'Khẩn cấp'
    };
    return types[type] || type;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý bảo trì</h1>
        {user?.permissions?.includes('CREATE_MAINTENANCE') && (
          <button onClick={() => handleOpenModal()} className="btn btn-primary">+ Thêm bảo trì</button>
        )}
      </div>

      <div className="card">
        <div className="toolbar">
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={filter.asset_id}
              onChange={(e) => setFilter({ ...filter, asset_id: e.target.value })}
            >
              <option value="">Tất cả tài sản</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            >
              <option value="">Tất cả loại</option>
              <option value="preventive">Định kỳ</option>
              <option value="corrective">Sửa chữa</option>
              <option value="emergency">Khẩn cấp</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tài sản</th>
                <th>Ngày bảo trì</th>
                <th>Loại</th>
                <th>Chi phí</th>
                <th>Kỹ thuật viên</th>
                <th>Bảo trì tiếp theo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.asset_name}</td>
                  <td>{new Date(record.maintenance_date).toLocaleDateString('vi-VN')}</td>
                  <td>{getTypeLabel(record.maintenance_type)}</td>
                  <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(record.cost || 0)}</td>
                  <td>{record.technician || '-'}</td>
                  <td>{record.next_maintenance_date ? new Date(record.next_maintenance_date).toLocaleDateString('vi-VN') : '-'}</td>
                  <td className="actions">
                    {user?.permissions?.includes('EDIT_MAINTENANCE') && (
                      <>
                        <button onClick={() => handleCompleteRepair(record)} className="btn btn-sm btn-success" title="Hoàn thành sửa chữa">✓ Hoàn thành</button>
                        <button onClick={() => handleOpenModal(record)} className="btn btn-sm btn-outline">Sửa</button>
                      </>
                    )}
                    {user?.permissions?.includes('DELETE_MAINTENANCE') && (
                      <button onClick={() => setDeleteModal({ show: true, id: record.id })} className="btn btn-sm btn-danger">Xóa</button>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editData ? 'Sửa bảo trì' : 'Thêm bảo trì mới'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tài sản *</label>
                  <select
                    name="asset_id"
                    value={formData.asset_id}
                    onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                    required
                  >
                    <option value="">Chọn tài sản</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>{asset.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày bảo trì *</label>
                    <input
                      type="date"
                      name="maintenance_date"
                      value={formData.maintenance_date}
                      onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Loại bảo trì</label>
                    <select
                      name="maintenance_type"
                      value={formData.maintenance_type}
                      onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                    >
                      <option value="preventive">Định kỳ</option>
                      <option value="corrective">Sửa chữa</option>
                      <option value="emergency">Khẩn cấp</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Chi phí</label>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Kỹ thuật viên</label>
                    <input
                      type="text"
                      name="technician"
                      value={formData.technician}
                      onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Ngày bảo trì tiếp theo</label>
                  <input
                    type="date"
                    name="next_maintenance_date"
                    value={formData.next_maintenance_date}
                    onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa bản ghi này không?</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteModal({ show: false, id: null })} className="btn btn-outline">Hủy</button>
              <button onClick={handleDelete} className="btn btn-danger">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
