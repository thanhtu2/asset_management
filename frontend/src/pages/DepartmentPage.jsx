import { useState, useEffect } from 'react';
import { departmentsAPI, usersAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const DepartmentPage = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    manager_id: '',
    parent_id: ''
  });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchData = async () => {
    try {
      const [deptRes, deptSimpleRes, userRes] = await Promise.all([
        departmentsAPI.getAll({ page: pagination.page, limit: pagination.limit }),
        departmentsAPI.getAllSimple(),
        usersAPI.getAll()
      ]);
      setDepartments(deptRes.data.data);
      setAllDepartments(deptSimpleRes.data);
      setPagination(prev => ({
        ...prev,
        total: deptRes.data.pagination.total,
        totalPages: deptRes.data.pagination.totalPages
      }));
      setUsers(userRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  };

  const handleOpenModal = (department = null) => {
    if (department) {
      setEditData(department);
      setFormData({
        name: department.name,
        code: department.code,
        manager_id: department.manager_id || '',
        parent_id: department.parent_id || ''
      });
    } else {
      setEditData(null);
      setFormData({
        name: '',
        code: '',
        manager_id: '',
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
        manager_id: formData.manager_id || null,
        parent_id: formData.parent_id || null
      };

      if (editData) {
        await departmentsAPI.update(editData.id, data);
      } else {
        await departmentsAPI.create(data);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving department:', error);
      alert(error.response?.data?.message || 'Không thể lưu phòng ban');
    }
  };

  const handleDelete = async () => {
    try {
      await departmentsAPI.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null });
      fetchData();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Không thể xóa phòng ban này');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý phòng ban</h1>
        {user?.permissions?.includes('CREATE_DEPARTMENT') && (
          <button onClick={() => handleOpenModal()} className="btn btn-primary">+ Thêm phòng ban</button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên phòng ban</th>
                <th>Quản lý</th>
                <th>phòng ban cha</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.code}</td>
                  <td>{dept.name}</td>
                  <td>{dept.manager_name || '-'}</td>
                  <td>{dept.parent_name || '-'}</td>
                  <td className="actions">
                    {user?.permissions?.includes('EDIT_DEPARTMENT') && (
                      <button onClick={() => handleOpenModal(dept)} className="btn btn-sm btn-outline">Sửa</button>
                    )}
                    {user?.permissions?.includes('DELETE_DEPARTMENT') && (
                      <button onClick={() => setDeleteModal({ show: true, id: dept.id })} className="btn btn-sm btn-danger">Xóa</button>
                    )}
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
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
              <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1} className="btn btn-sm">««</button>
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="btn btn-sm">«</button>
              <span className="pagination-page-info">Trang {pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="btn btn-sm">»</button>
              <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="btn btn-sm">»»</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editData ? 'Sửa phòng ban' : 'Thêm phòng ban mới'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên phòng ban *</label>
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
                  <label>Quản lý</label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  >
                    <option value="">Chọn quản lý</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>phòng ban cha</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  >
                    <option value="">Không có</option>
                    {allDepartments.filter(d => d.id !== editData?.id).map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
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
              <p>Bạn có chắc chắn muốn xóa phòng ban này không?</p>
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

export default DepartmentPage;
