import { useState, useEffect, useRef } from 'react';
import { inventoryAPI, assetsAPI, departmentsAPI } from '../api';
import QrScanner from '../components/QrScanner';

const InventoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [summaryByDept, setSummaryByDept] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'byDepartment'
  const [formData, setFormData] = useState({
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });
  const [addAssetsModal, setAddAssetsModal] = useState({ show: false, sessionId: null });
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // State for damage report modal
  const [damageModal, setDamageModal] = useState({ show: false, record: null, severity: 'minor', notes: '' });

  // State for QR Scanner
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanResult, setScanResult] = useState({ message: '', type: '', assetName: null });
  const isScanning = useRef(false);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, assetsRes, deptsRes] = await Promise.all([
        inventoryAPI.getAll(),
        assetsAPI.getAll({ page: 1, limit: 1000 }),
        departmentsAPI.getAllSimple()
      ]);
      setSessions(sessionsRes.data);
      setAssets(assetsRes.data?.data || assetsRes.data || []);
      setDepartments(deptsRes.data || deptsRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAssets([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      name: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
    setSelectedDepartment('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const sessionData = {
        ...formData,
        department_id: selectedDepartment || null
      };
      await inventoryAPI.create(sessionData);
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating session:', error);
      alert(error.response?.data?.message || 'Không thể tạo phiên kiểm kê');
    }
  };

  const handleViewDetails = async (session) => {
    if (!session) return;
    try {
      setSelectedSession(session);
      
      const recordsRes = await inventoryAPI.getRecordsByDepartment(session.id);
      setRecords(recordsRes.data);
      
      const summaryRes = await inventoryAPI.getSummaryByDepartment(session.id);
      setSummaryByDept(summaryRes.data || summaryRes);
      
      setShowDetailModal(true);
      setViewMode('byDepartment');
    } catch (error) {
      console.error('Error fetching records:', error);
      // Fallback to basic records
      try {
        const recordsRes = await inventoryAPI.getRecords(session.id);
        setRecords(recordsRes.data);
      } catch (err) {
        console.error('Error fetching basic records:', err);
      }
    }
  };

  // Handler for QR Code Scan Success
  const handleScanSuccess = async (decodedText) => {
    if (isScanning.current || !selectedSession) return;

    try {
      isScanning.current = true;
      
      let barcode = decodedText;
      // Check if the decoded text is a URL and try to extract the last part
      try {
        const url = new URL(decodedText);
        const pathParts = url.pathname.split('/').filter(part => part); // e.g., ['asset', '58']
        if (pathParts.length > 0) {
          barcode = pathParts[pathParts.length - 1]; // '58'
        }
      } catch (e) {
        // Not a valid URL, assume decodedText is the barcode itself. No action needed.
      }

      setScanResult({ message: `Đang xử lý mã: ${barcode}...`, type: 'info', assetName: null });

      const response = await inventoryAPI.scanAsset(selectedSession.id, { barcode });
      
      setScanResult({
        message: response.data.message || 'Quét thành công!',
        type: 'success',
        assetName: response.data.details?.assetName,
      });
      
      // Refresh the details view to show the updated asset status
      await handleViewDetails(selectedSession);

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi không xác định';
      setScanResult({ message: errorMessage, type: 'error', assetName: null });
      console.error('Scan Error:', error);
    } finally {
      // Allow scanning again after a short delay
      setTimeout(() => {
        isScanning.current = false;
        // Optional: clear the message after a few seconds
        // setTimeout(() => setScanResult({ message: '', type: '' }), 2000);
      }, 1000);
    }
  };

  const handleAddAssetsByDepartment = async (sessionId, departmentId) => {
    if (!departmentId) {
      alert('Vui lòng chọn phòng');
      return;
    }
    try {
      const result = await inventoryAPI.addAssetsByDepartment(sessionId, departmentId);
      alert(result.message || `Đã thêm ${result.added} tài sản`);
      handleViewDetails(selectedSession);
    } catch (error) {
      console.error('Error adding assets by department:', error);
      alert(error.response?.data?.message || 'Không thể thêm tài sản theo phòng');
    }
  };

  const handleAddAllAssets = async (sessionId) => {
    if (!confirm('Bạn có chắc chắn muốn thêm TẤT CẢ tài sản vào phiên kiểm kê?')) return;
    try {
      const result = await inventoryAPI.addAllAssets(sessionId);
      alert(result.message || `Đã thêm ${result.added} tài sản`);
      handleViewDetails(selectedSession);
    } catch (error) {
      console.error('Error adding all assets:', error);
      alert(error.response?.data?.message || 'Không thể thêm tất cả tài sản');
    }
  };

  const handleAddAssets = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.addAssets(addAssetsModal.sessionId, selectedAssets);
      setAddAssetsModal({ show: false, sessionId: null });
      setSelectedAssets([]);
      handleViewDetails(selectedSession);
    } catch (error) {
      console.error('Error adding assets:', error);
      alert(error.response?.data?.message || 'Không thể thêm tài sản');
    }
  };

  const handleUpdateRecord = async (recordToUpdate, newStatus) => {
    if (newStatus === 'damaged') {
      setDamageModal({ show: true, record: recordToUpdate, severity: 'minor', notes: '' });
      return;
    }

    const originalRecords = [...records];

    // Optimistic UI Update
    const updatedRecords = records.map(r =>
      r.id === recordToUpdate.id ? { ...r, status: newStatus } : r
    );
    setRecords(updatedRecords);

    try {
      await inventoryAPI.updateRecord(selectedSession.id, recordToUpdate.id, {
        status: newStatus,
        actual_quantity: newStatus === 'found' || newStatus === 'found_wrong_location' ? 1 : 0,
      });
      // On success, refresh summary for full consistency
      const summaryRes = await inventoryAPI.getSummaryByDepartment(selectedSession.id);
      setSummaryByDept(summaryRes.data || summaryRes);
    } catch (error) {
      // Rollback UI on error
      console.error('Error updating record:', error);
      alert('Không thể cập nhật bản ghi. Đang hoàn tác thay đổi.');
      setRecords(originalRecords);
    }
  };

  // Handler for submitting the damage report from the modal
  const handleDamageReport = async () => {
    if (!damageModal.record) return;

    const { record, severity, notes } = damageModal;
    const originalRecords = [...records];

    // Optimistic UI update
    const updatedRecords = records.map(r => r.id === record.id ? { ...r, status: 'damaged' } : r);
    setRecords(updatedRecords);
    setDamageModal({ show: false, record: null, severity: 'minor', notes: '' });

    try {
      // Step 1: Update the inventory record itself to mark it as 'damaged'
      await inventoryAPI.updateRecord(selectedSession.id, record.id, { status: 'damaged', notes });

      // Step 2: Apply the decision logic by updating the main asset's status
      if (severity === 'minor') {
        // Minor damage -> Set status to 'needs_repair', which will auto-create a maintenance ticket
        await assetsAPI.updateStatus(record.asset_id, 'needs_repair', notes || 'Hư hỏng phát hiện khi kiểm kê');
      } else if (severity === 'major') {
        // Major damage -> Set status to 'disposed' for liquidation
        await assetsAPI.updateStatus(record.asset_id, 'disposed', notes || 'Hư hỏng nặng, đề nghị thanh lý khi kiểm kê');
      }

      // Refresh summary data after successful update
      const summaryRes = await inventoryAPI.getSummaryByDepartment(selectedSession.id);
      setSummaryByDept(summaryRes.data || summaryRes);
    } catch (error) {
      // Rollback UI
      console.error('Error reporting damage:', error);
      alert('Không thể báo cáo hư hỏng. Đang hoàn tác. Lỗi: ' + (error.response?.data?.message || error.message));
      setRecords(originalRecords);
    }
  };

  const handleComplete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn hoàn thành phiên kiểm kê này?')) return;
    try {
      await inventoryAPI.complete(id);
      setShowDetailModal(false);
      fetchData();
    } catch (error) {
      console.error('Error completing session:', error);
      alert(error.response?.data?.message || 'Không thể hoàn thành phiên kiểm kê');
    }
  };

  const handleDelete = async () => {
    try {
      await inventoryAPI.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null });
      fetchData();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Không thể xóa phiên kiểm kê này');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'badge-new', label: 'Nháp' },
      in_progress: { class: 'badge-good', label: 'Đang kiểm kê' },
      completed: { class: 'badge-needs_repair', label: 'Hoàn thành' },
      cancelled: { class: 'badge-disposed', label: 'Đã hủy' }
    };
    const badge = badges[status] || badges.draft;
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  const unassignedAssets = assets.filter(a => !records.some(r => r.asset_id === a.id));

  // Group records by department
  const recordsByDepartment = records.reduce((acc, record) => {
    const deptName = record.department_name || 'Chưa phân phòng';
    if (!acc[deptName]) {
      acc[deptName] = [];
    }
    acc[deptName].push(record);
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý kiểm kê tài sản</h1>
        <button onClick={handleOpenModal} className="btn btn-primary">+ Tạo phiên kiểm kê</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên phiên</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.name}</td>
                  <td>{new Date(session.start_date).toLocaleDateString('vi-VN')}</td>
                  <td>{session.end_date ? new Date(session.end_date).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>{getStatusBadge(session.status)}</td>
                  <td className="actions">
                    <button onClick={() => handleViewDetails(session)} className="btn btn-sm btn-outline">Chi tiết</button>
                    {session.status === 'draft' && (
                      <>
                        <button 
                          onClick={() => setAddAssetsModal({ show: true, sessionId: session.id })} 
                          className="btn btn-sm btn-primary"
                        >
                          Thêm tài sản
                        </button>
                      </>
                    )}
                    {session.status === 'in_progress' && (
                      <button 
                        onClick={() => handleComplete(session.id)} 
                        className="btn btn-sm btn-success"
                      >
                        Hoàn thành
                      </button>
                    )}
                    {session.status !== 'completed' && session.status !== 'cancelled' && (
                       <button 
                         onClick={() => setDeleteModal({ show: true, id: session.id })} 
                         className="btn btn-sm btn-danger"
                       >
                         Xóa
                       </button>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Session Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Tạo phiên kiểm kê mới</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên phiên *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="VD: Kiểm kê quý 1/2024"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày bắt đầu *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phòng ban kiểm kê *</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Tạo và bắt đầu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSession && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '1000px', width: '90%' }}>
            <div className="modal-header">
              <h2>Chi tiết kiểm kê: {selectedSession.name}</h2>
              <button onClick={() => setShowDetailModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            
            <div style={{ padding: '15px', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {selectedSession.status === 'in_progress' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setScanResult({ message: 'Sẵn sàng quét...', type: 'info' });
                      setShowScannerModal(true);
                    }}
                  >
                    📷 Bắt đầu quét
                  </button>
                )}
                 <button 
                  className="btn btn-success"
                  onClick={() => handleComplete(selectedSession.id)}
                >
                  ✓ Hoàn thành phiên
                </button>
            </div>

            <div className="modal-body">
              {/* Summary by Department */}
              {summaryByDept.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Tổng hợp theo phòng</h3>
                  <table style={{ width: '100%', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Phòng</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Tổng</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: 'green' }}>Tìm thấy</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: 'red' }}>Thiếu</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: 'orange' }}>Hỏng</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: 'blue' }}>Thừa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryByDept.map((summary, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px' }}>{summary.department_name || 'Chưa phân phòng'}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{summary.total}</td>
                          <td style={{ padding: '8px', textAlign: 'center', color: 'green' }}>{summary.found_count}</td>
                          <td style={{ padding: '8px', textAlign: 'center', color: 'red' }}>{summary.missing_count}</td>
                          <td style={{ padding: '8px', textAlign: 'center', color: 'orange' }}>{summary.damaged_count}</td>
                           <td style={{ padding: '8px', textAlign: 'center', color: 'blue' }}>{summary.extra_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Records by Department */}
              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Danh sách tài sản</h3>
              {Object.keys(recordsByDepartment).length > 0 ? (
                Object.entries(recordsByDepartment).map(([deptName, deptRecords]) => (
                  <div key={deptName} style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '14px', color: '#333', marginBottom: '10px', padding: '5px 10px', background: '#e3f2fd' }}>
                      {deptName} ({deptRecords.length} tài sản)
                    </h4>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f9f9f9' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Mã TS</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Tên tài sản</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deptRecords.map((record) => (
                            <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '8px' }}>{record.asset_code}</td>
                              <td style={{ padding: '8px' }}>{record.asset_name}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                {(() => {
                                  const statusMap = {
                                    found: { label: 'Tìm thấy', className: 'good' },
                                    missing: { label: 'Mất', className: 'disposed' },
                                    damaged: { label: 'Hỏng', className: 'needs_repair' },
                                    extra: { label: 'Thừa', className: 'new' },
                                    found_wrong_location: { label: 'Sai vị trí', className: 'good' }
                                  };
                                  const display = statusMap[record.status] || { label: 'Chờ kiểm kê', className: 'pending' };
                                  return (
                                    <span className={`badge badge-${display.className}`}>{display.label}</span>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                {selectedSession.status !== 'completed' && (
                                  <>
                                    <button 
                                      onClick={() => handleUpdateRecord(record, 'found')}
                                      className="btn btn-sm btn-success"
                                      style={{ margin: '2px', padding: '4px 8px' }}
                                      disabled={record.status === 'found'}
                                    >
                                      ✓
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateRecord(record, 'missing')}
                                      className="btn btn-sm btn-danger"
                                      style={{ margin: '2px', padding: '4px 8px' }}
                                      disabled={record.status === 'missing'}
                                    >
                                      ✗
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateRecord(record, 'damaged')}
                                      className="btn btn-sm btn-outline"
                                      style={{ margin: '2px', padding: '4px 8px', color: '#f59e0b', borderColor: '#f59e0b' }}
                                      disabled={record.status === 'damaged'}
                                    >
                                      !
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#757575', padding: '20px' }}>
                  Chưa có tài sản trong phiên kiểm kê
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScannerModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Quét mã QR tài sản</h2>
              <button onClick={() => setShowScannerModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <div className="modal-body">
              <QrScanner 
                onScanSuccess={handleScanSuccess}
                onScanError={(error) => console.log(error?.message || 'QR Scan Error')}
              />
              {scanResult.message && (
                <div 
                  style={{ 
                    marginTop: '20px', 
                    padding: '10px', 
                    borderRadius: '5px',
                    backgroundColor: scanResult.type === 'success' ? '#d4edda' : scanResult.type === 'error' ? '#f8d7da' : '#cce5ff',
                    color: scanResult.type === 'success' ? '#155724' : scanResult.type === 'error' ? '#721c24' : '#004085',
                    textAlign: 'center'
                  }}
                >
                  {scanResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Assets Modal */}
      {addAssetsModal.show && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Thêm tài sản vào phiên kiểm kê</h2>
              <button onClick={() => setAddAssetsModal({ show: false, sessionId: null })} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <form onSubmit={handleAddAssets}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Chọn tài sản</label>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e0e0e0', padding: '10px' }}>
                    {unassignedAssets.length > 0 ? unassignedAssets.map((asset) => (
                      <div key={asset.id} style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            value={asset.id}
                            checked={selectedAssets.includes(asset.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssets([...selectedAssets, asset.id]);
                              } else {
                                setSelectedAssets(selectedAssets.filter(id => id !== asset.id));
                              }
                            }}
                          />
                          {asset.asset_code} - {asset.name}
                        </label>
                      </div>
                    )) : (
                      <p style={{ textAlign: 'center', color: '#757575' }}>Tất cả tài sản đã được thêm</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setAddAssetsModal({ show: false, sessionId: null })} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={selectedAssets.length === 0}>Thêm ({selectedAssets.length})</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa phiên kiểm kê này không?</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteModal({ show: false, id: null })} className="btn btn-outline">Hủy</button>
              <button onClick={handleDelete} className="btn btn-danger">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Damage Report Modal */}
      {damageModal.show && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Báo cáo hư hỏng</h2>
              <button onClick={() => setDamageModal({ ...damageModal, show: false })} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}><strong>Tài sản:</strong> {damageModal.record?.asset_name} ({damageModal.record?.asset_code})</p>
              <div className="form-group">
                <label>Mức độ hư hỏng</label>
                <select
                  value={damageModal.severity}
                  onChange={(e) => setDamageModal({ ...damageModal, severity: e.target.value })}
                >
                  <option value="minor">Hư hỏng nhẹ (Tạo yêu cầu sửa chữa)</option>
                  <option value="major">Hư hỏng nặng (Đề nghị thanh lý)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mô tả tình trạng (Ghi chú)</label>
                <textarea
                  rows="4"
                  placeholder="Mô tả chi tiết về hư hỏng, ví dụ: 'Màn hình bị sọc', 'Không lên nguồn'..."
                  value={damageModal.notes}
                  onChange={(e) => setDamageModal({ ...damageModal, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setDamageModal({ ...damageModal, show: false })} className="btn btn-outline">Hủy</button>
              <button type="button" onClick={handleDamageReport} className="btn btn-primary">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
