import { useState, useEffect } from 'react';
import { assetsAPI, categoriesAPI, locationsAPI, departmentsAPI, suppliersAPI, usersAPI } from '../api';

const AssetEditModal = ({ assetId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    asset_code: '',
    name: '',
    description: '',
    category_id: '',
    location_id: '',
    department_id: '',
    supplier_id: '',
    purchase_date: '',
    purchase_price: 0,
    current_value: 0,
    status: 'new',
    barcode: '',
    image_url: '',
    assigned_to: '',
    assigned_to_name: ''
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [catRes, locRes, deptRes, supRes, usersRes, assetRes] = await Promise.all([
          categoriesAPI.getAllSimple(),
          locationsAPI.getAllSimple(),
          departmentsAPI.getAllSimple(),
          suppliersAPI.getAll(),
          usersAPI.getAll(),
          assetsAPI.getById(assetId)
        ]);

        setCategories(catRes.data?.data || catRes.data || []);
        setLocations(locRes.data?.data || locRes.data || []);
        setDepartments(deptRes.data?.data || deptRes.data || []);
        setSuppliers(supRes.data?.data || supRes.data || []);
        setUsers(usersRes.data?.data || usersRes.data || []);

        const asset = assetRes.data;
        setFormData({
          asset_code: asset.asset_code || '',
          name: asset.name || '',
          description: asset.description || '',
          category_id: asset.category_id || '',
          location_id: asset.location_id || '',
          department_id: asset.department_id || '',
          supplier_id: asset.supplier_id || '',
          purchase_date: asset.purchase_date
            ? asset.purchase_date.slice(0, 10)
            : '',
          purchase_price: asset.purchase_price || 0,
          current_value: asset.current_value || 0,
          status: asset.status || 'new',
          barcode: asset.barcode || '',
          image_url: asset.image_url || '',
          assigned_to: asset.assigned_to || '',
          assigned_to_name: asset.assigned_to_name || ''
        });
      } catch (err) {
        console.error('Error loading asset:', err);
        setError('Không thể tải thông tin tài sản');
      } finally {
        setInitialLoading(false);
      }
    };

    init();
  }, [assetId]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (name === 'assigned_to') {
      const selectedUser = users.find(u => u.id.toString() === value);
      setFormData((prev) => ({
        ...prev,
        assigned_to: value,
        assigned_to_name: selectedUser ? (selectedUser.fullName || selectedUser.username) : ''
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = {
        ...formData,
        category_id: formData.category_id || null,
        location_id: formData.location_id || null,
        department_id: formData.department_id || null,
        supplier_id: formData.supplier_id || null,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        assigned_to_name: formData.assigned_to_name || null
      };
      await assetsAPI.update(assetId, data);
      onSuccess();
    } catch (err) {
      console.error('Error saving asset:', err);
      setError(err.response?.data?.message || 'Không thể lưu tài sản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg">
        {/* Header */}
        <div className="modal-header">
          <h2>✏️ Sửa tài sản</h2>
          <button
            onClick={onClose}
            className="btn btn-sm btn-outline"
            style={{ width: 32, height: 32, padding: 0, fontSize: 16 }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {initialLoading ? (
            <div className="loading" style={{ paddingBlock: '48px' }}>Đang tải...</div>
          ) : (
            <form id="asset-edit-form" onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label>Mã tài sản *</label>
                  <input
                    type="text"
                    name="asset_code"
                    value={formData.asset_code}
                    onChange={handleChange}
                    required
                    placeholder="Mã tài sản"
                  />
                </div>
                <div className="form-group">
                  <label>Tên tài sản *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Tên tài sản"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Người sử dụng</label>
              <select name="assigned_to" value={formData.assigned_to} onChange={handleChange}>
                <option value="">Chọn người sử dụng</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName || u.username}</option>
                ))}
              </select>
                </div>
                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Mô tả tài sản"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Danh mục</label>
                  <select name="category_id" value={formData.category_id} onChange={handleChange}>
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vị trí</label>
                  <select name="location_id" value={formData.location_id} onChange={handleChange}>
                    <option value="">Chọn vị trí</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>phòng ban</label>
                  <select name="department_id" value={formData.department_id} onChange={handleChange}>
                    <option value="">Chọn phòng ban</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nhà cung cấp</label>
                  <select name="supplier_id" value={formData.supplier_id} onChange={handleChange}>
                    <option value="">Chọn nhà cung cấp</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày mua</label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Giá mua</label>
                  <input
                    type="number"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Giá trị hiện tại</label>
                  <input
                    type="number"
                    name="current_value"
                    value={formData.current_value}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                  />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="new">Mới</option>
                    <option value="good">Tốt</option>
                    <option value="needs_repair">Cần sửa</option>
                    <option value="disposed">Đã thanh lý</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mã vạch</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="Mã vạch/QR code"
                  />
                </div>
                <div className="form-group">
                  <label>URL hình ảnh</label>
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="Đường dẫn hình ảnh"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!initialLoading && (
          <div className="modal-footer">
            <button onClick={onClose} className="btn btn-outline" disabled={loading}>
              Hủy
            </button>
            <button
              type="submit"
              form="asset-edit-form"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : '💾 Lưu thay đổi'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetEditModal;
