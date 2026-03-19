import { useState, useEffect } from 'react';
import { categoriesAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const CategoryPage = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parent_id: '',
    description: '',
    depreciation_rate: 0
  });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [parentCategories, setParentCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchParentCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit
      });
      setCategories(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParentCategories = async () => {
    try {
      const response = await categoriesAPI.getAllSimple();
      const allCategories = response.data.data || response.data;
      setParentCategories(allCategories.filter(c => !c.parent_id || c.parent_id === null));
    } catch (error) {
      console.error('Error fetching parent categories:', error);
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

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditData(category);
      setFormData({
        name: category.name,
        code: category.code,
        parent_id: category.parent_id || '',
        description: category.description || '',
        depreciation_rate: category.depreciation_rate || 0
      });
    } else {
      setEditData(null);
      setFormData({
        name: '',
        code: '',
        parent_id: '',
        description: '',
        depreciation_rate: 0
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
        await categoriesAPI.update(editData.id, data);
      } else {
        await categoriesAPI.create(data);
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.message || 'Không thể lưu danh mục');
    }
  };

  const handleDelete = async () => {
    try {
      await categoriesAPI.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null });
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Không thể xóa danh mục này');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý danh mục</h1>
        {user?.permissions?.includes('CREATE_CATEGORY') && (
          <button onClick={() => handleOpenModal()} className="btn btn-primary">+ Thêm danh mục</button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên danh mục</th>
                <th>Danh mục cha</th>
                <th>Tỷ lệ khấu hao (%)</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.code}</td>
                  <td>{category.name}</td>
                  <td>{category.parent_name || '-'}</td>
                  <td>{category.depreciation_rate}%</td>
                  <td>{category.description || '-'}</td>
                  <td className="actions">
                    {user?.permissions?.includes('EDIT_CATEGORY') && (
                      <button onClick={() => handleOpenModal(category)} className="btn btn-sm btn-outline">Sửa</button>
                    )}
                    {user?.permissions?.includes('DELETE_CATEGORY') && (
                      <button onClick={() => setDeleteModal({ show: true, id: category.id })} className="btn btn-sm btn-danger">Xóa</button>
                    )}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Không có dữ liệu</td>
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
              <h2>{editData ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên danh mục *</label>
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
                  <label>Danh mục cha</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  >
                    <option value="">Không có</option>
                    {parentCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tỷ lệ khấu hao (%)</label>
                  <input
                    type="number"
                    value={formData.depreciation_rate}
                    onChange={(e) => setFormData({ ...formData, depreciation_rate: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
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
              <p>Bạn có chắc chắn muốn xóa danh mục này không?</p>
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

export default CategoryPage;
