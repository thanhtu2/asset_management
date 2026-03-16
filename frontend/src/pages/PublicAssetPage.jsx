import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { assetsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const PublicAssetPage = () => {
  const { id, code } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [description, setDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    if (id || code) {
      fetchAsset();
    } else {
      // Reset state when on the main scanner page
      setLoading(false);
      setAsset(null);
      setError(null);
    }
  }, [id, code]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const fetchAsset = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (id) {
        console.log('Fetching asset by ID:', id);
        response = await assetsAPI.getById(id);
      } else if (code) {
        console.log('Fetching asset by code:', code);
        response = await assetsAPI.getByCode(code);
      } else {
        return; // Should not happen if useEffect is correct
      }
      console.log('Asset found:', response.data);
      setAsset(response.data);
      setSelectedStatus(response.data.status);
    } catch (err) {
      // Hiển thị thông báo lỗi chi tiết hơn để debug
      const errorMessage = err.response?.data?.message || err.message;
      const statusCode = err.response?.status;
      
      console.error('Error fetching asset:', {
        message: errorMessage,
        status: statusCode,
        fullError: err
      });
      
      // Kiểm tra lỗi network
      if (!err.response && !err.request) {
        setError('Không thể kết nối server. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra server đang chạy.');
      } else if (statusCode === 401) {
        setError('Lỗi xác thực. Vui lòng đăng nhập lại.');
      } else if (statusCode === 404) {
        setError('Không tìm thấy tài sản với mã này.');
      } else if (statusCode === 500) {
        setError('Lỗi server. Vui lòng thử lại sau.');
      } else {
        setError(`Không tìm thấy tài sản: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === asset.status) {
      setShowStatusModal(false);
      return;
    }
    const assetIdToUpdate = asset?.id;
    if (!assetIdToUpdate) {
      alert('Lỗi: Không thể xác định ID tài sản để cập nhật.');
      return;
    }
    setUpdating(true);
    try {
      let response;
      // Người dùng chưa đăng nhập chỉ có thể báo hỏng qua endpoint công khai mới.
      // Cần thêm hàm `reportDamage` vào `assetsAPI` của bạn.
      // Ví dụ trong `src/api/index.js`:
      // reportDamage: (id, description) => axios.post(`/assets/public/${id}/report-damage`, { description }),
      if (!user && selectedStatus === 'needs_repair') {
        if (!assetsAPI.reportDamage) {
          throw new Error("assetsAPI.reportDamage chưa được định nghĩa. Vui lòng xem ví dụ trong PublicAssetPage.jsx.");
        }
        response = await assetsAPI.reportDamage(assetIdToUpdate, description);
      } else {
        // Người dùng đã đăng nhập sử dụng endpoint (đã được bảo vệ) như cũ.
        // Thao tác này sẽ thất bại với lỗi 401 nếu chưa đăng nhập và cố gắng đổi trạng thái khác 'needs_repair'.
        response = await assetsAPI.updateStatus(assetIdToUpdate, selectedStatus, description);
      }

      setAsset({ ...asset, status: selectedStatus });
      setShowStatusModal(false);
      setDescription('');
      
      if (response.data?.maintenanceCreated) {
        setSuccessMessage('Đã cập nhật trạng thái và tạo phiếu bảo trì!');
      } else {
        setSuccessMessage('Cập nhật trạng thái thành công!');
      }
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      alert(`Không thể cập nhật trạng thái: ${errorMessage}`);
    } finally {
      setUpdating(false);
    }
  };

  const startScanner = () => {
    setShowScanner(true);
    
    // Wait for DOM to be ready
    setTimeout(() => {
      if (scannerRef.current && !html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        html5QrcodeScannerRef.current.render(
          (decodedText) => {
            html5QrcodeScannerRef.current.clear();
            setShowScanner(false);
            
            console.log('QR Scanned:', decodedText);
            
            let assetId = null;
            let assetCode = null;

            // 1. Try to parse as a URL (preferred format)
            // e.g., http://domain.com/asset/123
            // e.g., http://domain.com/asset/code/TS001
            try {
              const url = new URL(decodedText);
              const pathParts = url.pathname.split('/').filter(p => p);
              
              if (pathParts[0] === 'asset') {
                if (pathParts[1] === 'code' && pathParts[2]) {
                  assetCode = pathParts[2];
                } else if (pathParts[1] && !isNaN(pathParts[1])) {
                  assetId = pathParts[1];
                }
              }
            } catch (e) { /* Not a URL, proceed */ }

            if (assetId) {
              navigate(`/asset/${assetId}`);
              return;
            }
            if (assetCode) {
              navigate(`/asset/code/${assetCode}`);
              return;
            }
            
            // 2. Try to parse as JSON (for legacy QRs)
            try {
              const qrData = JSON.parse(decodedText);
              if (qrData.id && !isNaN(qrData.id)) {
                navigate(`/asset/${qrData.id}`);
                return;
              }
              if (qrData.code) {
                navigate(`/asset/code/${qrData.code}`);
                return;
              }
            } catch (e) { /* Not JSON, proceed */ }
            
            // 3. Fallback: treat the whole string as an ID or code
            const trimmedText = decodedText.trim();
            if (trimmedText && !isNaN(trimmedText)) {
              navigate(`/asset/${trimmedText}`);
            } else {
              navigate(`/asset/code/${trimmedText}`);
            }
          },
          (errorMessage) => {
            // Parse error, ignore
            console.log('QR Scan error:', errorMessage);
          }
        );
      }
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(() => {});
      html5QrcodeScannerRef.current = null;
    }
    setShowScanner(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      good: { class: 'badge-good', label: 'Tốt' },
      needs_repair: { class: 'badge-needs_repair', label: 'Cần sửa' }
    };
    const badge = badges[status] || badges.new;
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  // Get available statuses based on login status
  const getAvailableStatuses = () => {
    const allStatuses = [
      { value: 'good', label: 'Tốt' },
      { value: 'needs_repair', label: 'Cần sửa' }
    ];
    
    // If user is logged in, show all statuses
    if (user) {
      return allStatuses;
    }
    
    // If user is not logged in, only show "Cần sửa" (report damage only)
    return allStatuses.filter(s => s.value === 'needs_repair');
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  // Show scanner interface
  if (showScanner) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>QUÉT MÃ QR</h1>
          <p style={{ color: '#666' }}>Quét mã QR trên tài sản để xem thông tin</p>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '20px' }}>
          <div id="qr-reader" ref={scannerRef}></div>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={stopScanner}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                background: '#666',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No asset ID in URL, show the initial scanner page
  if (!id) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>TRA CỨU TÀI SẢN</h1>
          <p style={{ color: '#666' }}>Quét mã QR hoặc nhập mã tài sản để tra cứu</p>
        </div>

        {/* QR Scanner Button */}
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '30px', textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '60px' }}>📷</span>
          </div>
          <button
            onClick={startScanner}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              marginBottom: '15px'
            }}
          >
            📱 Quét mã QR
          </button>

          {/* Show login info if not logged in */}
          {!user && !authLoading && (
            <p style={{ color: '#666', fontSize: '13px', marginTop: '10px' }}>
              ⚠️ Bạn chưa đăng nhập. Chỉ có thể báo hỏng thiết bị.
            </p>
          )}

          {/* Show logged in info */}
          {user && (
            <p style={{ color: '#4CAF50', fontSize: '13px', marginTop: '10px' }}>
              ✓ Đã đăng nhập: {user.fullName || user.username}. Bạn có thể cập nhật trạng thái thiết bị.
            </p>
          )}
        </div>

        {/* Manual code input */}
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '20px', marginTop: '20px' }}>
          <p style={{ marginBottom: '15px', fontWeight: '500' }}>Hoặc nhập mã tài sản:</p>
          <CodeInputForm />
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#999', fontSize: '12px' }}>
          <p>Hệ thống Quản lý Tài sản</p>
        </div>
      </div>
    );
  }

  // Asset ID is present, handle loading/error/data states
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2 style={{ color: 'red' }}>{error}</h2>
        <p>Vui lòng kiểm tra lại mã tài sản</p>
        <button
          onClick={() => navigate('/asset')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Quét mã khác
        </button>
      </div>
    );
  }

  // Fallback if asset is null after loading and no error
  if (!asset) {
    return null; // Or a "not found" message
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>THÔNG TIN TÀI SẢN</h1>
        <p style={{ color: '#666' }}>Quét mã để xem thông tin tài sản</p>
        
        {/* Back to scanner button */}
        <button
          onClick={() => navigate('/asset')}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          ← Quét mã khác
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#4CAF50', color: 'white', padding: '20px', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '22px' }}>{asset.name}</h2>
          <p style={{ margin: '10px 0 0 0', fontSize: '18px', opacity: 0.9 }}>{asset.asset_code}</p>
        </div>

        {/* Status */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
          {getStatusBadge(asset.status)}
        </div>

        {/* Report Status Button */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
          <button 
            onClick={() => setShowStatusModal(true)}
            style={{
              background: '#FF9800',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📋 Báo tình trạng thiết bị
          </button>
          
          {/* Show login status hint */}
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            {!user ? '⚠️ Bạn chưa đăng nhập - Chỉ có thể báo hỏng' : '✓ Bạn đang đăng nhập - Có thể cập nhật trạng thái'}
          </p>
        </div>

        {/* Details */}
        <div style={{ padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 0', color: '#666', width: '40%' }}>Danh mục</td>
                <td style={{ padding: '12px 0', fontWeight: '500' }}>{asset.category_name || '-'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 0', color: '#666' }}>Vị trí</td>
                <td style={{ padding: '12px 0', fontWeight: '500' }}>{asset.location_name || '-'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 0', color: '#666' }}>phòng ban</td>
                <td style={{ padding: '12px 0', fontWeight: '500' }}>{asset.department_name || '-'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 0', color: '#666' }}>Nhà cung cấp</td>
                <td style={{ padding: '12px 0', fontWeight: '500' }}>{asset.supplier_name || '-'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 0', color: '#666' }}>Người sử dụng</td>
                <td style={{ padding: '12px 0', fontWeight: '500' }}>{asset.assigned_to_name || '-'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 0', color: '#666' }}>Ngày mua</td>
                <td style={{ padding: '12px 0', fontWeight: '500' }}>{formatDate(asset.purchase_date)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 0', color: '#666' }}>Giá mua</td>
                <td style={{ padding: '12px 0', fontWeight: '500', color: '#2196F3' }}>{formatCurrency(asset.purchase_price)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 0', color: '#666' }}>Giá trị hiện tại</td>
                <td style={{ padding: '12px 0', fontWeight: '500', color: '#4CAF50', fontSize: '18px' }}>{formatCurrency(asset.current_value)}</td>
              </tr>
              {asset.barcode && (
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 0', color: '#666' }}>Mã vạch</td>
                  <td style={{ padding: '12px 0', fontWeight: '500' }}>{asset.barcode}</td>
                </tr>
              )}
            </tbody>
          </table>

          {asset.description && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#666', marginBottom: '5px' }}>Mô tả:</p>
              <p style={{ background: '#f9f9f9', padding: '10px', borderRadius: '4px', margin: 0 }}>{asset.description}</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px', color: '#999', fontSize: '12px' }}>
        <p>Hệ thống Quản lý Tài sản</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#4CAF50',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          {successMessage}
        </div>
      )}

      {/* Status Report Modal */}
      {showStatusModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowStatusModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Báo tình trạng thiết bị</h3>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              {!user ? 'Chọn tình trạng hiện tại của thiết bị (chỉ có thể báo hỏng):' : 'Chọn tình trạng hiện tại của thiết bị:'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {getAvailableStatuses().map(status => (
                <label key={status.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: selectedStatus === status.value ? '2px solid #4CAF50' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: selectedStatus === status.value ? '#f5f5f5' : 'white'
                }}>
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={selectedStatus === status.value}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{ marginRight: '10px' }}
                  />
                  {status.label}
                </label>
              ))}
            </div>
            {selectedStatus === 'needs_repair' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Mô tả tình trạng:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả vấn đề của thiết bị..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || selectedStatus === asset.status}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: updating ? '#ccc' : '#4CAF50',
                  color: 'white',
                  cursor: updating ? 'not-allowed' : 'pointer'
                }}
              >
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Separate component for manual code input
const CodeInputForm = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) {
      navigate(`/asset/code/${code.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Nhập mã tài sản..."
        style={{
          flex: 1,
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '14px'
        }}
      />
      <button
        type="submit"
        style={{
          padding: '12px 20px',
          background: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Tìm kiếm
      </button>
    </form>
  );
};

export default PublicAssetPage;
