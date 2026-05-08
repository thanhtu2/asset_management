import { useState, useEffect } from 'react';
import { usersAPI, departmentsAPI } from '../api';
// Thêm rolesAPI để call danh sách vai trò
import { rolesAPI } from '../api'; 

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'user',
    department_id: '',
    isActive: true
  });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, deptRes, rolesRes] = await Promise.all([
        usersAPI.getAll(),
        departmentsAPI.getAllSimple(), // Sử dụng getAllSimple cho dropdown
        rolesAPI.getAll() // getAll của rolesAPI đã trả về tất cả roles
      ]);
      setUsers(usersRes.data);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.data || []);
      setRoles(rolesRes.data?.data || rolesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    setShowPassword(false);
    if (user) {
      setEditData(user);
      setFormData({
        username: user.username,
        password: '',
        fullName: user.fullName,
        role: user.role,
        department_id: user.department_id || '',
        isActive: user.isActive
      });
    } else {
      setEditData(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        role: 'user',
        department_id: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        department_id: formData.department_id || null
      };

      // Khi sửa, nếu không nhập mật khẩu thì không gửi trường password lên server
      if (editData && !data.password) {
        delete data.password;
      }

      if (editData) {
        await usersAPI.update(editData.id, data);
      } else {
        await usersAPI.create(data);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.message || 'Không thể lưu người dùng');
    }
  };

  const handleDelete = async () => {
    try {
      await usersAPI.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null });
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Không thể xóa người dùng này');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý người dùng</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => usersAPI.exportUsers()} className="btn btn-outline">Xuất Excel</button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">+ Thêm người dùng</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Họ tên</th>
                <th>phòng ban</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.fullName}</td>
                  <td>{user.department_name || '-'}</td>
                  {/* Tìm tên vai trò từ danh sách động, fallback về mã gốc nếu không có */}
                  <td>{roles.find(r => r.code === user.role)?.name || user.role}</td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-good' : 'badge-disposed'}`}>
                      {user.isActive ? 'Hoạt động' : 'Khóa'}
                    </span>
                  </td>
                  <td className="actions">
                    <button onClick={() => handleOpenModal(user)} className="btn btn-sm btn-outline">Sửa</button>
                    <button onClick={() => setDeleteModal({ show: true, id: user.id })} className="btn btn-sm btn-danger">Xóa</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Không có dữ liệu</td>
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
              <h2>{editData ? 'Sửa người dùng' : 'Thêm người dùng mới'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên đăng nhập *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={editData}
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu {editData ? '' : '*'}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editData} // Chỉ bắt buộc khi tạo mới
                      placeholder={editData ? 'Để trống nếu không đổi' : ''}
                      style={{ width: '100%', paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px'
                      }}
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Họ tên *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vai trò</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="">Chọn vai trò</option>
                      {roles.map((r) => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phòng ban</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    >
                      <option value="">Chọn phòng ban</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {editData && (
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      {' '}Hoạt động
                    </label>
                  </div>
                )}
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
              <p>Bạn có chắc chắn muốn xóa người dùng này không?</p>
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

export default UserManagementPage;
