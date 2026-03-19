import { useState, useEffect } from 'react';
import { rolesAPI, permissionsAPI } from '../api';

const RoleManagementPage = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [rolePermissions, setRolePermissions] = useState([]);
  const [showPermModal, setShowPermModal] = useState(false);
  const [newPermData, setNewPermData] = useState({ code: '', name: '', module: '' });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleData, setNewRoleData] = useState({ code: '', name: '', description: '' });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lấy danh sách Roles và tất cả Permissions khi vào trang
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Mỗi khi chọn một Role khác, gọi API lấy danh sách quyền của Role đó
  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole);
    } else {
      setRolePermissions([]);
    }
  }, [selectedRole]);

  const fetchInitialData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rolesAPI.getAll(),
        permissionsAPI.getAll()
      ]);
      setRoles(rolesRes.data?.data || rolesRes.data || []);
      setPermissions(permsRes.data?.data || permsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleCode) => {
    try {
      // API này nên trả về mảng các permission_code mà role này đang có
      const response = await rolesAPI.getPermissions(roleCode);
      const codes = response.data.map(p => p.permission_code || p.code || p);
      setRolePermissions(codes);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      setRolePermissions([]);
    }
  };

  const handleTogglePermission = (permCode) => {
    setRolePermissions(prev => {
      if (prev.includes(permCode)) {
        return prev.filter(c => c !== permCode);
      } else {
        return [...prev, permCode];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await rolesAPI.updatePermissions(selectedRole, rolePermissions);
      alert('Lưu phân quyền thành công!');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Có lỗi xảy ra khi lưu phân quyền');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePermission = async (e) => {
    e.preventDefault();
    try {
      await permissionsAPI.create(newPermData);
      alert('Thêm quyền mới thành công!');
      setShowPermModal(false);
      setNewPermData({ code: '', name: '', module: '' });
      // Tải lại dữ liệu để hiển thị quyền mới
      const permsRes = await permissionsAPI.getAll();
      setPermissions(permsRes.data?.data || permsRes.data || []);
    } catch (error) {
      console.error('Error creating permission:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi thêm quyền');
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await rolesAPI.create(newRoleData);
      alert('Thêm vai trò mới thành công!');
      setShowRoleModal(false);
      setNewRoleData({ code: '', name: '', description: '' });
      // Tải lại danh sách roles
      const rolesRes = await rolesAPI.getAll();
      setRoles(rolesRes.data?.data || rolesRes.data || []);
    } catch (error) {
      console.error('Error creating role:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi thêm vai trò');
    }
  };

  // Nhóm các permission lại theo module để hiển thị cho đẹp
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const mod = perm.module || 'Hệ thống';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Quản lý Phân quyền (RBAC)</h1>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
            Cấu hình quyền truy cập cho từng vai trò trong hệ thống
          </p>
        </div>
        <div>
          <button onClick={() => setShowRoleModal(true)} className="btn btn-outline" style={{ marginRight: '10px' }}>+ Thêm vai trò</button>
          <button onClick={() => setShowPermModal(true)} className="btn btn-outline">+ Thêm quyền mới</button>
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div className="form-group" style={{ maxWidth: '400px', marginBottom: '30px' }}>
          <label style={{ fontWeight: 600, fontSize: '15px' }}>Chọn vai trò cần phân quyền:</label>
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{ padding: '10px', fontSize: '15px' }}
          >
            <option value="">-- Vui lòng chọn một vai trò --</option>
            {roles.map(r => (
              <option key={r.code} value={r.code}>{r.name} ({r.code})</option>
            ))}
          </select>
        </div>

        {selectedRole ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                <div key={moduleName} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                    {moduleName.toUpperCase()}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {perms.map(perm => (
                      <label key={perm.code} style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', gap: '10px' }}>
                        <input 
                          type="checkbox" 
                          checked={rolePermissions.includes(perm.code)}
                          onChange={() => handleTogglePermission(perm.code)}
                          style={{ marginTop: '3px', width: '16px', height: '16px' }}
                        />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '14px', color: '#334155' }}>{perm.name}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{perm.code}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : '💾 Lưu cấu hình phân quyền'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>👆</span>
            Vui lòng chọn một vai trò ở danh sách trên để xem và chỉnh sửa quyền hạn.
          </div>
        )}
      </div>

      {/* Modal Thêm Vai Trò Mới */}
      {showRoleModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Thêm Vai Trò Mới</h2>
              <button onClick={() => setShowRoleModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <form onSubmit={handleCreateRole}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Mã vai trò (Code) *</label>
                  <input 
                    type="text" 
                    value={newRoleData.code} 
                    onChange={e => setNewRoleData({...newRoleData, code: e.target.value.toLowerCase()})} 
                    placeholder="VD: manager, accountant..." 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Tên vai trò *</label>
                  <input type="text" value={newRoleData.name} onChange={e => setNewRoleData({...newRoleData, name: e.target.value})} placeholder="VD: Trưởng phòng" required />
                </div>
                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea value={newRoleData.description} onChange={e => setNewRoleData({...newRoleData, description: e.target.value})} placeholder="Mô tả quyền hạn..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowRoleModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Quyền Mới */}
      {showPermModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Thêm Quyền Mới</h2>
              <button onClick={() => setShowPermModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <form onSubmit={handleCreatePermission}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Mã quyền (Code) *</label>
                  <input 
                    type="text" 
                    value={newPermData.code} 
                    onChange={e => setNewPermData({...newPermData, code: e.target.value.toUpperCase()})} 
                    placeholder="VD: VIEW_DASHBOARD" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Tên quyền *</label>
                  <input type="text" value={newPermData.name} onChange={e => setNewPermData({...newPermData, name: e.target.value})} placeholder="VD: Xem bảng điều khiển" required />
                </div>
                <div className="form-group">
                  <label>Nhóm chức năng (Module)</label>
                  <input type="text" value={newPermData.module} onChange={e => setNewPermData({...newPermData, module: e.target.value})} placeholder="VD: Báo cáo" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPermModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementPage;