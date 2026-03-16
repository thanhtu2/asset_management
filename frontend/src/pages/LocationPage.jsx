import { useState, useEffect } from 'react';
import { locationsAPI } from '../api';

const LocationPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    parent_id: ''
  });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [parentLocations, setParentLocations] = useState([]);

  useEffect(() => {
    fetchLocations();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchParentLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit
      });
      setLocations(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParentLocations = async () => {
    try {
      const response = await locationsAPI.getAllSimple();
      const allLocations = response.data.data || response.data;
      setParentLocations(allLocations.filter(l => !l.parent_id || l.parent_id === null));
    } catch (error) {
      console.error('Error fetching parent locations:', error);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  };

  const handleOpenModal = (location = null) => {
    if (location) {
      setEditData(location);
      setFormData({
        name: location.name,
        code: location.code,
        address: location.address || '',
        parent_id: location.parent_id || ''
      });
    } else {
      setEditData(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        parent_id: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        parent_id: formData.parent_id || null
      };

      if (editData) {
        await locationsAPI.update(editData.id, data);
      } else {
        await locationsAPI.create(data);
      }
      setShowModal(false);
      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      alert(error.response?.data?.message || 'Không thể lưu vị trí');
    }
  };

  const handleDelete = async () => {
    try {
      await locationsAPI.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null });
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Không thể xóa vị trí này');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý vị trí</h1>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">+ Thêm vị trí</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên vị trí</th>
                <th>Địa chỉ</th>
                <th>Vị trí cha</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id}>
                  <td>{location.code}</td>
                  <td>{location.name}</td>
                  <td>{location.address || '-'}</td>
                  <td>{location.parent_name || '-'}</td>
                  <td className="actions">
                    <button onClick={() => handleOpenModal(location)} className="btn btn-sm btn-outline">Sửa</button>
                    <button onClick={() => setDeleteModal({ show: true, id: location.id })} className="btn btn-sm btn-danger">Xóa</button>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} bản ghi
          </div>
          <div className="pagination-controls">
            <select
              value={pagination.limit}
              onChange={(e) => handleLimitChange(e.target.value)}
              className="pagination-limit"
            >
              <option value="10">10 / trang</option>
              <option value="20">20 / trang</option>
              <option value="50">50 / trang</option>
            </select>
            <div className="pagination-buttons">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="btn btn-sm"
              >
                ««
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn btn-sm"
              >
                «
              </button>
              <span className="pagination-page-info">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-sm"
              >
                »
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-sm"
              >
                »»
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editData ? 'Sửa vị trí' : 'Thêm vị trí mới'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên vị trí *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mã *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Vị trí cha</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  >
                    <option value="">Không có</option>
                    {parentLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
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
              <p>Bạn có chắc chắn muốn xóa vị trí này không?</p>
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

export default LocationPage;
