import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assetsAPI, categoriesAPI, locationsAPI, departmentsAPI, suppliersAPI, usersAPI } from '../api';

const AssetFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
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
    salvage_value: 0,
    current_value: 0,
    status: 'new',
    barcode: '',
    image_url: '',
    assigned_to: '', // ID người dùng được gán
    assigned_to_name: '', // Tên người dùng được gán
    assigned_date: '', // Ngày cấp tài sản
  });

  useEffect(() => {
    fetchFilters();
    if (isEdit) {
      fetchAsset();
    }
  }, [id]);

  // Tự động tính toán giá trị hiện tại
  useEffect(() => {
    // Mặc định giá trị hiện tại bằng giá mua nếu không có đủ thông tin tính khấu hao
    let nextValue = formData.purchase_price || 0;

    if (nextValue > 0 && formData.category_id && formData.purchase_date) {
      const category = categories.find(c => c.id.toString() === formData.category_id.toString());
      
      // Chỉ tính toán giảm trừ nếu tìm thấy danh mục và có tỷ lệ khấu hao > 0
      if (category && category.depreciation_rate > 0) {
        const purchaseDate = new Date(formData.purchase_date);
        const now = new Date();
        
        // 1. Tính số tháng đã trôi qua
        let monthsPassed = (now.getFullYear() - purchaseDate.getFullYear()) * 12;
        monthsPassed -= purchaseDate.getMonth();
        monthsPassed += now.getMonth();
        monthsPassed = monthsPassed <= 0 ? 0 : monthsPassed;

        // 2. Tính mức khấu hao hàng tháng
        const annualDepreciationRate = category.depreciation_rate / 100;
        const monthlyDepreciation = (formData.purchase_price * annualDepreciationRate) / 12;
        const totalDepreciation = monthlyDepreciation * monthsPassed;
        
        // 3. Tính giá trị còn lại (không thấp hơn giá trị thu hồi)
        const remainingValue = formData.purchase_price - totalDepreciation;
        const salvageValue = formData.salvage_value || 0;
        nextValue = Math.max(salvageValue, remainingValue, 0);
      }
    }

    // Chỉ cập nhật state nếu giá trị tính toán khác với giá trị hiện tại để tránh re-render thừa
    if (Math.round(nextValue) !== formData.current_value) {
      setFormData(prev => ({ ...prev, current_value: Math.round(nextValue) }));
    }
  }, [formData.purchase_price, formData.category_id, formData.purchase_date, formData.salvage_value, categories]);

  const fetchFilters = async () => {
    try {
      const [catRes, locRes, deptRes, supRes, usersRes] = await Promise.all([
        categoriesAPI.getAllSimple(),
        locationsAPI.getAllSimple(),
        departmentsAPI.getAllSimple(),
        suppliersAPI.getAll(),
        usersAPI.getAll()
      ]);
      // Handle both paginated and non-paginated responses
      setCategories(catRes.data?.data || catRes.data || []);
      setLocations(locRes.data?.data || locRes.data || []);
      setDepartments(deptRes.data?.data || deptRes.data || []);
      setSuppliers(supRes.data?.data || supRes.data || []);
      setUsers(usersRes.data?.data || usersRes.data || []);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchAsset = async () => {
    try {
      const response = await assetsAPI.getById(id);
      const asset = response.data;
      setFormData({
        asset_code: asset.asset_code || '',
        name: asset.name || '',
        description: asset.description || '',
        category_id: asset.category_id || '',
        location_id: asset.location_id || '',
        department_id: asset.department_id || '',
        supplier_id: asset.supplier_id || '',
        purchase_date: asset.purchase_date || '',
        purchase_price: asset.purchase_price || 0,
        salvage_value: asset.salvage_value || 0,
        current_value: asset.current_value || 0,
        status: asset.status || 'chờ cấp',
        barcode: asset.barcode || '',
        image_url: asset.image_url || '',
        assigned_to: asset.assigned_to || '', // ID người dùng được gán
        assigned_to_name: asset.assigned_to_name || '', // Tên người dùng được gán
        assigned_date: asset.assigned_date ? asset.assigned_date.split('T')[0] : '', // Ngày cấp tài sản
      });
    } catch (error) {
      console.error('Error fetching asset:', error);
      setError('Không thể tải thông tin tài sản');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Xử lý đặc biệt cho trường assigned_to để cập nhật assigned_to_name
    if (name === 'assigned_to') {
      const selectedUser = users.find(u => u.id.toString() === value);
      setFormData({
        ...formData,
        assigned_to: value,
        assigned_to_name: selectedUser ? (selectedUser.fullName || selectedUser.username) : '',
        assigned_date: value ? (formData.assigned_date || new Date().toISOString().slice(0, 10)) : '', // Tự động điền ngày hiện tại nếu gán người dùng và chưa có ngày cấp
      });
      return;
    }
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
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

      if (isEdit) {
        await assetsAPI.update(id, data);
      } else {
        await assetsAPI.create(data);
      }
      navigate('/assets');
    } catch (error) {
      console.error('Error saving asset:', error);
      setError(error.response?.data?.message || 'Không thể lưu tài sản');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Sửa tài sản' : 'Thêm tài sản mới'}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Mã tài sản {isEdit ? '*' : ''}</label>
              <input
                type="text"
                name="asset_code"
                value={formData.asset_code}
                onChange={handleChange}
                required={!!isEdit}
                disabled={!isEdit}
                placeholder={!isEdit ? "Hệ thống sẽ tự động cấp mã" : "Mã tài sản"}
                style={!isEdit ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
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
              rows="3"
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
            <div className="form-group">
              <label>Ngày cấp</label>
              <input
                type="date"
                name="assigned_date"
                value={formData.assigned_date}
                onChange={handleChange}
              />
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
              <label>Giá trị hiện tại (tự động tính)</label>
              <input
                type="number"
                name="current_value"
                value={formData.current_value}
                readOnly
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                onChange={handleChange} // Giữ lại để tương thích với logic chung, nhưng readOnly sẽ ngăn người dùng nhập
                min="0"
                step="1000"
              />
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="new">Chờ cấp</option>
                <option value="good">Đang sử dụng</option>
                <option value="needs_repair">Cần sửa chữa</option>
                <option value="damaged">Hỏng</option>
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

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
            <Link to="/assets" className="btn btn-outline">Hủy</Link>
            
            {/* Suggest New Purchase Button */}
            {isEdit && formData.status === 'đã thanh lý' && (
              <Link 
                to={`/assets/new?name=${encodeURIComponent(formData.name)}&category_id=${formData.category_id}&department_id=${formData.department_id}`}
                className="btn btn-success"
                style={{ marginLeft: 'auto' }}
              >
                + Đề xuất mua mới
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetFormPage;
