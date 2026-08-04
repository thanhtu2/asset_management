import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { assetsAPI, categoriesAPI, locationsAPI, departmentsAPI, maintenanceAPI } from '../api';
import AssetImportModal from '../components/AssetImportModal';
import AssetEditModal from '../components/AssetEditModal';
import { useAuth } from '../contexts/AuthContext';

const AssetListPage = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    assigned_to: '',
    category_id: '',
    location_id: '',
    department_id: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [viewModal, setViewModal] = useState({ show: false, asset: null });
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'users', 'maintenance'
  const [userHistory, setUserHistory] = useState([]);
  const [maintHistory, setMaintHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editModal, setEditModal] = useState({ show: false, assetId: null });
  const [qrModal, setQrModal] = useState({ show: false, asset: null, qrData: null, loading: false });
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Bulk selection state
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showBulkPrintModal, setShowBulkPrintModal] = useState(false);
  const [bulkQrData, setBulkQrData] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const printAreaRef = useRef(null);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [filters, pagination.page, pagination.limit]);

  //Hàm helper tính số tháng đã qua kể từ ngày mua để phục vụ cho việc khấu hao tài sản
  const assetMonthsPassed = (asset) => {
    if (!asset.purchase_date) return 0;
    const purchaseDate = new Date(asset.purchase_date);
    const now = new Date();
    let months = (now.getFullYear() - purchaseDate.getFullYear()) * 12;
    months -= purchaseDate.getMonth();
    months += now.getMonth();
    return Math.max(0, months);
  };

  const formatMonthlyDep = (asset) => {
    if (!asset.depreciation_rate || !asset.purchase_price) return 0;
    const monthly = (asset.purchase_price * (asset.depreciation_rate / 100)) / 12;
    return new Intl.NumberFormat('vi-VN').format(Math.round(monthly));
  };

  const fetchFilters = async () => {
    try {
      const [catRes, locRes, deptRes] = await Promise.all([
        categoriesAPI.getAllSimple(),
        locationsAPI.getAllSimple(),
        departmentsAPI.getAllSimple()
      ]);
      setCategories(catRes.data?.data || catRes.data || []);
      setLocations(locRes.data?.data || locRes.data || []);
      setDepartments(deptRes.data?.data || deptRes.data || []);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchAssets = async (resetPage = false) => {
    try {
      // Only include filters with values (not empty strings)
      const activeFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          activeFilters[key] = filters[key];
        }
      });
      
      const currentPage = resetPage ? 1 : pagination.page;
      
      // Thêm timestamp để chống cache trình duyệt/proxy
      const response = await assetsAPI.getAll({
        ...activeFilters,
        page: currentPage,
        limit: pagination.limit,
        _t: new Date().getTime()
      });
      setAssets(response.data.data);
      setPagination(prev => ({
        ...prev,
        page: currentPage,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };
  // Khi người dùng nhấn xem chi tiết tài sản, sẽ mở modal và tải đồng thời cả thông tin chung, lịch sử người dùng và lịch sử bảo trì để hiển thị trong các tab tương ứng
  const handleViewAsset = async (asset) => {
    setViewModal({ show: true, asset });
    setActiveTab('info');
    setHistoryLoading(true);
    setUserHistory([]);
    setMaintHistory([]);
    
    try {
      const [maintRes, userHistRes] = await Promise.all([
        maintenanceAPI.getAll({ asset_id: asset.id }),
        assetsAPI.getUserHistory ? assetsAPI.getUserHistory(asset.id) : Promise.resolve({ data: [] })
      ]);
      setMaintHistory(maintRes.data?.data || maintRes.data || []);
      setUserHistory(userHistRes.data?.data || userHistRes.data || []);
    } catch (error) {
      console.error('Error fetching asset history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
    setFilters(prev => ({ ...prev })); // Trigger refetch
  };

  const handleDelete = async () => {
    try {
      await assetsAPI.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null });
      fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Không thể xóa tài sản này');
    }
  };
  const getStatusLabel = (status) => {
    const labels = {
      new: 'Chờ cấp',
      good: 'Đang sử dụng',
      needs_repair: 'Cần sửa chữa',
      damaged: 'Hỏng',
      disposed: 'Đã thanh lý'
    };
    return labels[status] || status;
  };
  
  // Hàm helper để hiển thị badge trạng thái với màu sắc khác nhau
  const getStatusBadge = (status) => {
    const badges = {
      new: { class: 'badge-new', label: 'Chờ cấp' },
      good: { class: 'badge-good', label: 'Đang sử dụng' },
      needs_repair: { class: 'badge-needs_repair', label: 'Cần sửa chữa' },
      damaged: { class: 'badge-damaged', label: 'Hỏng' },
      disposed: { class: 'badge-disposed', label: 'Đã thanh lý' }
    };
    const badge = badges[status] || { class: 'badge-new', label: status || 'Chờ cấp' };
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  const handleShowQR = async (asset) => {
    setQrModal({ show: true, asset, qrData: null, loading: true });
    try {
      const response = await assetsAPI.getQRCode(asset.id);
      setQrModal(prev => ({ ...prev, qrData: response.data, loading: false }));
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setQrModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle bulk QR loading
  const handleBulkQRLoad = async () => {
    setBulkLoading(true);
    try {
      const results = [];
      // Chia nhỏ request ra thành từng đợt (batch) 5 tài sản/lần 
      // để tránh lỗi "Too many connections" làm sập Database Backend
      const batchSize = 5;
      for (let i = 0; i < selectedAssets.length; i += batchSize) {
        const batch = selectedAssets.slice(i, i + batchSize);
        const batchPromises = batch.map(assetId => assetsAPI.getQRCode(assetId).then(res => res.data));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
      setBulkQrData(results);
    } catch (error) {
      console.error('Error loading bulk QR:', error);
      alert('Không thể tải QR code. Vui lòng thử lại.');
    } finally {
      setBulkLoading(false);
    }
  };

  // Hàm mã hóa chống XSS khi chèn dữ liệu vào innerHTML
  const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  };

  // Print single QR label - use modal with proper print CSS
  const printSingleQR = async (asset) => {
    try {
      // Fetch QR code from API
      const response = await assetsAPI.getQRCode(asset.id);
      const qrData = response.data;
      
      // Create a hidden print area in the document body for printing
      let printArea = document.getElementById('single-qr-print-area');
      if (printArea) {
        printArea.remove();
      }
      
      printArea = document.createElement('div');
      printArea.id = 'single-qr-print-area';
      printArea.style.position = 'fixed';
      printArea.style.left = '-9999px';
      printArea.style.top = '0';
      printArea.style.background = 'white';
      printArea.style.padding = '10px';
      
      // Build label HTML with proper classes for print CSS
      const qrImage = qrData.qr_code 
        ? `<img src="${qrData.qr_code}" style="width:60px;height:60px;display:block;" />`
        : '';
      
      printArea.innerHTML = `
        <div class="qr-label" style="width:113px;height:85px;padding:4px;border:1px dashed #ccc;display:flex;flex-direction:row;align-items:center;gap:4px;background:white;page-break-inside:avoid;">
          <div class="qr-label__qr" style="width:60px;height:60px;flex-shrink:0;">
            ${qrImage}
          </div>
          <div class="qr-label__info" style="flex:1;overflow:hidden;">
            <div class="qr-label__code" style="font-weight:bold;font-size:9px;color:#000;word-break:break-word;">${escapeHTML(asset.asset_code)}</div>
            <div class="qr-label__name" style="font-size:7px;color:#333;margin-top:2px;word-break:break-word;">${escapeHTML(asset.name)}</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(printArea);
      
      // Wait for image to load, then print
      setTimeout(() => {
        window.print();
        // Clean up after printing
        setTimeout(() => {
          printArea.remove();
        }, 1000);
      }, 500);
      
    } catch (error) {
      console.error('Error printing QR:', error);
      alert('Không thể in QR code');
    }
  };


  // Print bulk QR labels - create hidden print area
  const printBulkQR = () => {
    if (!printAreaRef.current || bulkQrData.length === 0) return;
    
    // Create hidden print area
    let printArea = document.getElementById('bulk-qr-print-area');
    if (printArea) {
      printArea.remove();
    }
    
    printArea = document.createElement('div');
    printArea.id = 'bulk-qr-print-area';
    printArea.style.position = 'fixed';
    printArea.style.left = '-9999px';
    printArea.style.top = '0';
    printArea.style.background = 'white';
    printArea.style.padding = '10px';
    
    // Build all QR labels HTML
    let labelsHtml = '';
    bulkQrData.forEach((qr) => {
      const qrImage = qr.qr_code 
        ? `<img src="${qr.qr_code}" style="width:60px;height:60px;display:block;" />`
        : '';
      
      labelsHtml += `
        <div class="qr-label" style="width:113px;height:85px;padding:4px;border:1px dashed #ccc;display:flex;flex-direction:row;align-items:center;gap:4px;background:white;page-break-inside:avoid;float:left;margin:2px;">
          <div class="qr-label__qr" style="width:60px;height:60px;flex-shrink:0;">
            ${qrImage}
          </div>
          <div class="qr-label__info" style="flex:1;overflow:hidden;">
            <div class="qr-label__code" style="font-weight:bold;font-size:9px;color:#000;word-break:break-word;">${escapeHTML(qr.asset_code)}</div>
            <div class="qr-label__name" style="font-size:7px;color:#333;margin-top:2px;word-break:break-word;">${escapeHTML(qr.asset_name)}</div>
          </div>
        </div>
      `;
    });
    
    printArea.innerHTML = labelsHtml;
    document.body.appendChild(printArea);
    
    // Trigger print
    setTimeout(() => {
      window.print();
      // Clean up after printing
      setTimeout(() => {
        printArea.remove();
      }, 1000);
    }, 500);
  };


  // Helper to generate QR SVG string
  function generateQRCodeSVG(value) {
    // Simple QR placeholder - in production would use actual QR generation
    return `<rect x="10" y="10" width="180" height="180" fill="white"/>
      <rect x="20" y="20" width="50" height="50" fill="black"/>
      <rect x="80" y="20" width="40" height="40" fill="black"/>
      <rect x="130" y="20" width="50" height="50" fill="black"/>
      <rect x="20" y="80" width="40" height="40" fill="black"/>
      <rect x="80" y="80" width="40" height="40" fill="black"/>
      <rect x="130" y="80" width="50" height="50" fill="black"/>
      <rect x="20" y="130" width="50" height="50" fill="black"/>
      <rect x="80" y="130" width="40" height="40" fill="black"/>
      <rect x="130" y="130" width="50" height="50" fill="black"/>`;
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý tài sản</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => assetsAPI.exportAssets()} className="btn btn-outline">⬇ Xuất Excel</button>
          {(user?.role === 'admin' || user?.permissions?.includes('CREATE_ASSET')) && (
            <>
              <button onClick={() => setShowImportModal(true)} className="btn btn-outline">⬆ Import Excel</button>
              <Link to="/assets/new" className="btn btn-primary">+ Thêm tài sản</Link>
            </>
          )}
        </div>
      </div>

      <div className="card">
        {/* Bulk Actions Bar */}
        {selectedAssets.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-actions__count">Đã chọn {selectedAssets.length} tài sản</span>
            <button 
              onClick={() => setShowBulkPrintModal(true)}
              className="btn btn-primary btn-sm bulk-actions__btn"
            >
              🖨️ In QR ({selectedAssets.length})
            </button>
            <button 
              onClick={() => setSelectedAssets([])}
              className="btn btn-outline btn-sm"
            >
              Hủy chọn
            </button>
          </div>
        )}

        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm tên, mã, người dùng..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchAssets(true);
                }
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={filters.department_id}
              onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
            >
              <option value="">Tất cả phòng ban</option> 
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
              ))}
            </select> 
            <select
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={filters.location_id}
              onChange={(e) => setFilters({ ...filters, location_id: e.target.value })}
            >
              <option value="">Tất cả vị trí</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="new">Chờ cấp</option>
              <option value="good">Đang sử dụng</option>
              <option value="needs_repair">Cần sửa chữa</option>
              <option value="damaged">Hỏng</option>
              <option value="disposed">Đã thanh lý</option>
            </select>
            <button onClick={() => fetchAssets(true)} className="btn btn-primary">
              Tìm kiếm
            </button>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    className="asset-checkbox"
                    checked={selectedAssets.length === assets.length && assets.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAssets(assets.map(a => a.id));
                      } else {
                        setSelectedAssets([]);
                      }
                    }}
                  />
                </th>
                <th>Mã tài sản</th>
                <th>Tên tài sản</th>
                <th>Danh mục</th>
                <th>Vị trí</th>
                <th>phòng ban</th>
                <th>Người sử dụng</th>
                <th>Ngày cấp</th>
                <th>Giá trị</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="asset-checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssets([...selectedAssets, asset.id]);
                        } else {
                          setSelectedAssets(selectedAssets.filter(id => id !== asset.id));
                        }
                      }}
                    />
                  </td>
                  <td>{asset.asset_code}</td>
                  <td>{asset.name}</td>
                  <td>{asset.category_name || '-'}</td>
                  <td>{asset.location_name || '-'}</td>
                  <td>{asset.department_name || '-'}</td>
                  <td>{asset.assigned_to ? (asset.user_full_name || 'Đang tải...') : (asset.assigned_to_name || '-')}</td>
                  <td>{asset.assigned_date ? new Date(asset.assigned_date).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(asset.current_value || 0)}</td>
                  <td>{getStatusBadge(asset.status)}</td>
                  <td className="actions">
                    <button 
                      onClick={() => handleViewAsset(asset)} 
                      className="btn btn-sm btn-outline"
                    >
                      Xem
                    </button>
                    <button 
                      onClick={() => handleShowQR(asset)}
                      className="btn btn-sm btn-outline"
                      title="Hiển thị QR Code"
                    >
                      QR
                    </button>
                    {(user?.role === 'admin' || user?.permissions?.includes('EDIT_ASSET')) && (
                      <button
                        onClick={() => setEditModal({ show: true, assetId: asset.id })}
                        className="btn btn-sm btn-outline"
                      >Sửa</button>
                    )}
                    {(user?.role === 'admin' || user?.permissions?.includes('DELETE_ASSET')) && (
                      <button
                        onClick={() => setDeleteModal({ show: true, id: asset.id })}
                        className="btn btn-sm btn-danger"
                      >
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center' }}>Không có dữ liệu</td>
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
              <option value="100">100 / trang</option>
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

      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa tài sản này không?</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteModal({ show: false, id: null })} className="btn btn-outline">
                Hủy
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {viewModal.show && viewModal.asset && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>Chi tiết tài sản</h2>
              <button onClick={() => setViewModal({ show: false, asset: null })} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <div className="modal-body">
              <div className="tabs" style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
                <button 
                  className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('info')}
                  style={{ padding: '10px 0', border: 'none', background: 'none', borderBottom: activeTab === 'info' ? '2px solid #2563eb' : 'none', color: activeTab === 'info' ? '#2563eb' : '#666', fontWeight: activeTab === 'info' ? 'bold' : 'normal', cursor: 'pointer' }}
                >
                  Thông tin chung
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('users')}
                  style={{ padding: '10px 0', border: 'none', background: 'none', borderBottom: activeTab === 'users' ? '2px solid #2563eb' : 'none', color: activeTab === 'users' ? '#2563eb' : '#666', fontWeight: activeTab === 'users' ? 'bold' : 'normal', cursor: 'pointer' }}
                >
                  Lịch sử người dùng
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('maintenance')}
                  style={{ padding: '10px 0', border: 'none', background: 'none', borderBottom: activeTab === 'maintenance' ? '2px solid #2563eb' : 'none', color: activeTab === 'maintenance' ? '#2563eb' : '#666', fontWeight: activeTab === 'maintenance' ? 'bold' : 'normal', cursor: 'pointer' }}
                >
                  Lịch sử bảo trì
                </button>
              </div>

              {activeTab === 'info' && (
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Mã tài sản:</label>
                    <span>{viewModal.asset.asset_code}</span>
                  </div>
                  <div className="detail-item">
                    <label>Tên tài sản:</label>
                    <span>{viewModal.asset.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Danh mục:</label>
                    <span>{viewModal.asset.category_name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Vị trí:</label>
                    <span>{viewModal.asset.location_name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phòng ban:</label>
                    <span>{viewModal.asset.department_name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Nhà cung cấp:</label>
                    <span>{viewModal.asset.supplier_name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Người sử dụng hiện tại:</label>
                    <span>{viewModal.asset.user_full_name || viewModal.asset.assigned_to_name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Ngày cấp:</label>
                    <span>{viewModal.asset.assigned_date ? new Date(viewModal.asset.assigned_date).toLocaleDateString('vi-VN') : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Ngày mua:</label>
                    <span>{viewModal.asset.purchase_date ? new Date(viewModal.asset.purchase_date).toLocaleDateString('vi-VN') : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Giá mua:</label>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewModal.asset.purchase_price || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Giá trị hiện tại:</label>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewModal.asset.current_value || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Thời gian khấu hao:</label>
                    <span>{assetMonthsPassed(viewModal.asset)} tháng</span>
                  </div>
                  <div className="detail-item">
                    <label>Mức khấu hao/tháng:</label>  
                    <span>{formatMonthlyDep(viewModal.asset)} ₫</span>
                  </div>
                  <div className="detail-item">
                    <label>Trạng thái:</label>
                    <span>{getStatusBadge(viewModal.asset.status)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Mã vạch:</label>
                    <span>{viewModal.asset.barcode || '-'}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Mô tả:</label>
                    <span>{viewModal.asset.description || '-'}</span>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="table-container">
                  {historyLoading ? <p>Đang tải...</p> : (
                    <table>
                      <thead>
                        <tr>
                          <th>Người dùng</th>
                          <th>Phòng ban</th>
                          <th>Ngày bắt đầu</th>
                          <th>Ngày kết thúc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userHistory.length > 0 ? userHistory.map((h, i) => (
                          <tr key={i}>
                            <td>{h.fullName}</td>
                            <td>{h.department_name}</td>
                            <td>{h.start_date ? new Date(h.start_date).toLocaleDateString('vi-VN') : '-'}</td>
                            <td>{h.end_date ? new Date(h.end_date).toLocaleDateString('vi-VN') : 'Hiện tại'}</td>
                          </tr>
                        )) : <tr><td colSpan="4" style={{ textAlign: 'center' }}>Chưa có lịch sử sử dụng</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div className="table-container">
                  {historyLoading ? <p>Đang tải...</p> : (
                    <table>
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th>Loại</th>
                          <th>Mô tả</th>
                          <th>Chi phí</th>
                          <th>Kỹ thuật viên</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maintHistory.length > 0 ? maintHistory.map((m, i) => (
                          <tr key={i}>
                            <td>{new Date(m.maintenance_date).toLocaleDateString('vi-VN')}</td>
                            <td>{m.maintenance_type === 'preventive' ? 'Định kỳ' : m.maintenance_type === 'corrective' ? 'Sửa chữa' : 'Khẩn cấp'}</td>
                            <td>{m.description}</td>
                            <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(m.cost || 0)}</td>
                            <td>{m.technician || '-'}</td>
                          </tr>
                        )) : <tr><td colSpan="5" style={{ textAlign: 'center' }}>Chưa có lịch sử bảo trì</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {user?.permissions?.includes('EDIT_ASSET') && (
                <button
                  onClick={() => {
                    setViewModal({ show: false, asset: null });
                    setEditModal({ show: true, assetId: viewModal.asset.id });
                  }}
                  className="btn btn-primary"
                >
                  ✏️ Sửa
                </button>
              )}
              <button onClick={() => setViewModal({ show: false, asset: null })} className="btn btn-outline">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <AssetImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => { fetchAssets(true); }}
        />
      )}

      {editModal.show && (
        <AssetEditModal
          assetId={editModal.assetId}
          onClose={() => setEditModal({ show: false, assetId: null })}
          onSuccess={() => {
            setEditModal({ show: false, assetId: null });
            fetchAssets();
          }}
        />
      )}

      {/* QR Code Modal */}
      {qrModal.show && qrModal.asset && (
        <div className="modal-overlay" id="single-qr-modal">
          <div className="modal" id="single-qr-modal-inner">
            <div className="modal-header">
              <h2>QR Code - {qrModal.asset.name}</h2>
              <button onClick={() => setQrModal({ show: false, asset: null, qrData: null })} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div>
                <div style={{ padding: '20px', background: 'white', display: 'inline-block', borderRadius: '8px' }}>
                  <QRCodeSVG
                    value={`${window.location.origin}/asset/${qrModal.asset.id}`}
                    size={200}
                    level={"H"}
                    includeMargin={true}
                  />
                </div>
                <div style={{ marginTop: '15px' }}>
                  <p><strong>Mã tài sản:</strong> {qrModal.asset.asset_code}</p>
                  <p><strong>Tên tài sản:</strong> {qrModal.asset.name}</p>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    Quét QR để xem thông tin tài sản
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => printSingleQR(qrModal.asset)} 
                className="btn btn-primary"
              >
                🖨️ In nhãn
              </button>
              <button onClick={() => setQrModal({ show: false, asset: null, qrData: null })} className="btn btn-outline">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Print QR Modal */}
      {showBulkPrintModal && (
        <div className="modal-overlay" id="bulk-print-modal">
          <div className="modal modal-lg" id="bulk-print-modal-inner">
            <div className="modal-header">
              <h2>In QR hàng loạt ({selectedAssets.length} tài sản)</h2>
              <button onClick={() => {
                setShowBulkPrintModal(false);
                setBulkQrData([]);
              }} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <div className="modal-body">
              {bulkQrData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ marginBottom: '15px' }}>Bấm "Tải QR" để tải mã QR của các tài sản đã chọn</p>
                  <button 
                    onClick={handleBulkQRLoad}
                    disabled={bulkLoading}
                    className="btn btn-primary"
                  >
                    {bulkLoading ? 'Đang tải...' : '📥 Tải QR'}
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ marginBottom: '15px', fontSize: '13px', color: '#666' }}>
                    Preview - Click "In" để in {bulkQrData.length} nhãn
                  </p>
                  <div className="qr-batch-preview" ref={printAreaRef}>
                    {bulkQrData.map((qr, index) => (
                      <div key={index} className="qr-label">
                        <div className="qr-label__qr">
                          {qr.qr_code ? (
                            <img src={qr.qr_code} alt="QR" />
                          ) : (
                            <QRCodeSVG
                              value={`${window.location.origin}/asset/${qr.asset_id}`}
                              size={56}
                              level={"L"}
                            />
                          )}
                        </div>
                        <div className="qr-label__info">
                          <div className="qr-label__code">{qr.asset_code}</div>
                          <div className="qr-label__name">{qr.asset_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {bulkQrData.length > 0 && (
                <button onClick={printBulkQR} className="btn btn-primary">
                  🖨️ In {bulkQrData.length} nhãn
                </button>
              )}
              <button onClick={() => {
                setShowBulkPrintModal(false);
                setBulkQrData([]);
              }} className="btn btn-outline">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetListPage;
