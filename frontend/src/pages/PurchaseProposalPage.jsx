import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { purchaseProposalsAPI, departmentsAPI, API_BASE_URL } from '../api';
import { useSearchParams } from 'react-router-dom';

const PurchaseProposalPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [activeProposal, setActiveProposal] = useState(null);
  const [history, setHistory] = useState([]);
  const [attachedFile, setAttachedFile] = useState(null);

  useEffect(() => {
    fetchDepartments();
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    if (id) {
      fetchProposal(id);
    } else if (action === 'create') {
      setActiveProposal({
        code: 'Tạo tự động',
        title: '',
        description: '',
        department_id: user?.department_id || '',
        items: [{ name: '', spec: '', unit: 'Chiếc', quantity: 1, unit_price: 0 }],
        total_amount: 0,
        status: 'draft',
        created_at: new Date().toISOString()
      });
      setHistory([]);
      setAttachedFile(null);
    } else {
      setActiveProposal(null);
      fetchProposalsList();
      setAttachedFile(null);
    }
  }, [searchParams]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getAllSimple();
      setDepartments(response.data.data || response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProposalsList = async () => {
    setLoading(true);
    try {
      const response = await purchaseProposalsAPI.getAll({ page: 1, limit: 10 });
      setProposals(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposal = async (id) => {
    setLoading(true);
    try {
      const response = await purchaseProposalsAPI.getById(id);
      let data = response.data;
      
      // Đảm bảo items luôn là mảng, parse nếu backend trả về chuỗi JSON
      if (typeof data.items === 'string') {
        try {
          data.items = JSON.parse(data.items);
          if (typeof data.items === 'string') {
            data.items = JSON.parse(data.items); // Phá vỡ vòng lặp chuỗi JSON bị lồng 2 lần
          }
        } catch (e) {
          data.items = [];
        }
      } else if (!Array.isArray(data.items)) {
        data.items = [];
      }

      setActiveProposal(data);
      generateHistory(data);
      setAttachedFile(null);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHistory = (proposal) => {
    const hist = [];
    
    // 1. Luôn có bước tạo phiếu
    hist.push({
      step: 'Soạn phiếu',
      handler: proposal.requester_name || 'Người đề xuất',
      role: 'Người đề xuất',
      date: new Date(proposal.created_at).toLocaleString('vi-VN'),
      status: 'Đã gửi',
      comment: ''
    });

    // 2. Lãnh đạo phòng duyệt
    const passedDept = ['director_pending', 'approved'].includes(proposal.status) || (proposal.status === 'rejected' && proposal.director_id);
    const rejectedByDept = proposal.status === 'rejected' && !proposal.director_id;

    if (passedDept || rejectedByDept) {
      hist.push({
        step: 'Lãnh đạo phòng duyệt',
        handler: proposal.department_leader_name || 'Trưởng phòng',
        role: 'Lãnh đạo phòng',
        date: proposal.updated_at ? new Date(proposal.updated_at).toLocaleString('vi-VN') : '',
        status: passedDept ? 'Đã phê duyệt' : 'Từ chối',
        comment: proposal.department_comment || ''
      });
    }

    // 3. Giám đốc duyệt
    const passedDirector = proposal.status === 'approved';
    const rejectedByDirector = proposal.status === 'rejected' && proposal.director_id;

    if (passedDirector || rejectedByDirector) {
      hist.push({
        step: 'Giám đốc duyệt',
        handler: proposal.director_name || 'Giám đốc',
        role: 'Ban Giám đốc',
        date: proposal.updated_at ? new Date(proposal.updated_at).toLocaleString('vi-VN') : '',
        status: passedDirector ? 'Đã phê duyệt' : 'Từ chối',
        comment: proposal.director_comment || ''
      });
    }

    // 4. Hoàn tất
    if (proposal.status === 'approved') {
      hist.push({
        step: 'Hoàn tất',
        handler: 'Hệ thống',
        role: 'Tự động',
        date: proposal.updated_at ? new Date(proposal.updated_at).toLocaleString('vi-VN') : '',
        status: 'Hoàn thành',
        comment: 'Phiếu đề xuất mua sắm đã được phê duyệt thành công.'
      });
    }

    setHistory(hist);
  };

  const handleViewFile = async (fileUrl) => {
    if (!fileUrl) {
      alert('Không có file để xem.');
      return;
    }

    try {
      // Lấy tên file từ đường dẫn đầy đủ (VD: /uploads/file.pdf -> file.pdf)
      const filename = fileUrl.split('/').pop();
      if (!filename) throw new Error('Đường dẫn file không hợp lệ.');

      const baseUrl = API_BASE_URL.replace(/\/$/, ''); // Xóa dấu gạch chéo ở cuối nếu có
      const fullUrl = `${baseUrl}/download/${encodeURIComponent(filename)}`; // Mã hóa URL an toàn
      const response = await fetch(fullUrl, {
        credentials: 'include' // Quan trọng: Bắt buộc gửi cookie
      });

      if (response.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn hoặc không có quyền xem file này. Vui lòng đăng nhập lại.');
      }
      if (!response.ok) {
        let errorMsg = response.statusText;
        try {
          const errData = await response.json();
          if (errData.message) errorMsg = errData.message;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('Lỗi khi xem file:', error);
      alert(`Không thể xem file: ${error.message}`);
    }
  };

  const updateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const addItem = () => {
    const currentItems = Array.isArray(activeProposal.items) ? activeProposal.items : [];
    const newItems = [...currentItems, { name: '', spec: '', unit: 'Chiếc', quantity: 1, unit_price: 0 }];
    setActiveProposal({
      ...activeProposal,
      items: newItems,
      total_amount: updateTotal(newItems),
      total_vat: updateTotal(newItems) * 0.1
    });
  };

  const updateItem = (index, field, value) => {
    const currentItems = Array.isArray(activeProposal.items) ? activeProposal.items : [];
    const newItems = [...currentItems];
    if (newItems[index]) {
      newItems[index][field] = value;
      if (field === 'quantity' || field === 'unit_price') {
        newItems[index][field] = parseFloat(value) || 0;
      }
      setActiveProposal({
        ...activeProposal,
        items: newItems,
        total_amount: updateTotal(newItems),
        total_vat: updateTotal(newItems) * 0.1
      });
    }
  };

  const removeItem = (index) => {
    const currentItems = Array.isArray(activeProposal.items) ? activeProposal.items : [];
    const newItems = currentItems.filter((_, i) => i !== index);
    setActiveProposal({
      ...activeProposal,
      items: newItems,
      total_amount: updateTotal(newItems),
      total_vat: updateTotal(newItems) * 0.1
    });
  };

  const handleSave = async (submitStatus = 'draft') => {
    try {
      const commentInput = document.getElementById('approval-comment');
      const comment = commentInput ? commentInput.value : '';

      const payload = {
        code: activeProposal.code === 'Tạo tự động' ? `PR-${Date.now()}` : activeProposal.code,
        title: activeProposal.title || 'Phiếu đề xuất mua sắm',
        description: activeProposal.description,
        department_id: activeProposal.department_id || null,
        items: activeProposal.items,
        total_amount: activeProposal.total_amount || 0,
        status: submitStatus
      };
      
      if (submitStatus === 'director_pending' || (submitStatus === 'rejected' && activeProposal.status === 'department_pending')) {
        payload.department_comment = comment;
      } else if (submitStatus === 'approved' || (submitStatus === 'rejected' && activeProposal.status === 'director_pending')) {
        payload.director_comment = comment;
      }

      // Xử lý chuyển JSON sang FormData để gửi File đính kèm lên Backend
      if (attachedFile) {
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
          if (key === 'items') {
            formData.append(key, JSON.stringify(payload[key])); // Backend cần parse JSON.parse() cho chuỗi này
          } else if (payload[key] !== null && payload[key] !== undefined) {
            formData.append(key, payload[key]);
          }
        });
        formData.append('file', attachedFile);
        
        // Sử dụng fetch thuần để tránh bị axios ép header Content-Type: application/json làm mất file
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        const url = activeProposal.id ? `${baseUrl}/purchases/${activeProposal.id}` : `${baseUrl}/purchases`;
        
        const response = await fetch(url, {
          method: activeProposal.id ? 'PUT' : 'POST',
          credentials: 'include', // Gửi HTTP-only cookie
          body: formData
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || 'Lỗi khi upload file đính kèm');
        }
        
        alert(activeProposal.id ? 'Cập nhật thành công!' : 'Tạo phiếu thành công!');
        if (!activeProposal.id) { setSearchParams({}); fetchProposalsList(); }
        else fetchProposal(activeProposal.id);
        return; // Thoát hàm sớm vì đã lưu xong
      }

      // Luồng lưu bình thường (không có file đính kèm)
      if (activeProposal.id) {
         await purchaseProposalsAPI.update(activeProposal.id, payload);
         alert('Cập nhật thành công!');
         fetchProposal(activeProposal.id);
      } else {
         await purchaseProposalsAPI.create(payload);
         alert('Tạo phiếu thành công!');
         setSearchParams({});
         fetchProposalsList();
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu phiếu');
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  const getCurrentStep = () => {
    if (!activeProposal) return 1;
    switch (activeProposal.status) {
      case 'draft': return 1;
      case 'department_pending': return 2;
      case 'director_pending': return 3;
      case 'approved': return 4;
      case 'rejected': return activeProposal.director_id ? 3 : 2;
      default: return 1;
    }
  };
  const currentStep = getCurrentStep();

  // Logic kiểm tra quyền hạn chỉnh sửa & phê duyệt
  const isEditable = !activeProposal?.id || ['draft', 'rejected'].includes(activeProposal?.status);
  const canApproveDept = user?.role === 'admin' || user?.permissions?.includes('APPROVE_DEPARTMENT_PURCHASE');
  const canApproveDirector = user?.role === 'admin' || user?.permissions?.includes('APPROVE_DIRECTOR_PURCHASE');
  const showApprovalSidebar = activeProposal?.id && (
    (activeProposal?.status === 'department_pending' && canApproveDept) ||
    (activeProposal?.status === 'director_pending' && canApproveDirector)
  );

  return (
    <div className="purchase-proposal-page">
      {!activeProposal ? (
        // List view
        <div className="proposals-list">
          <div className="page-header">
            <h1>Phiếu đề xuất mua sắm</h1>
            <button className="btn btn-primary" onClick={() => setSearchParams({ action: 'create' })}>
              + Tạo mới
            </button>
          </div>
          {/* List table - simplified */}
          <div className="card">
            {proposals.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Mã phiếu</th>
                      <th>Tiêu đề</th>
                      <th>Ngày tạo</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.code}</strong></td>
                        <td>{p.title}</td>
                        <td>{new Date(p.created_at).toLocaleDateString('vi-VN')}</td>
                        <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.total_amount || 0)}</td>
                        <td>
                          <span className={`badge ${p.status === 'approved' ? 'badge-good' : p.status === 'rejected' ? 'badge-disposed' : p.status === 'draft' ? 'badge-new' : 'badge-pending'}`}>
                            {p.status === 'draft' ? 'Nháp' :
                             p.status === 'department_pending' ? 'Chờ duyệt (Phòng)' :
                             p.status === 'director_pending' ? 'Chờ duyệt (GĐ)' :
                             p.status === 'approved' ? 'Đã phê duyệt' :
                             p.status === 'rejected' ? 'Từ chối' : p.status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => setSearchParams({ id: p.id })} className="btn btn-sm btn-outline">
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <span style={{ fontSize: '48px', opacity: 0.5, display: 'block', marginBottom: '16px' }}>📄</span>
                <h3>Chưa có phiếu đề xuất nào</h3>
                <p style={{ color: '#64748b', marginBottom: '20px' }}>Hãy tạo phiếu đề xuất mua sắm đầu tiên của bạn.</p>
                <button className="btn btn-primary" onClick={() => setSearchParams({ action: 'create' })}>
                  + Tạo phiếu mới
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Detail view matching mockup
        <div className="proposal-detail">
          <div className="header">
            <button onClick={() => setSearchParams({})} className="btn btn-outline">← Danh sách</button>
            <h1>Phiếu đề xuất mua sắm tài sản</h1>
            <div className="proposal-info">
              <strong>{activeProposal.code}</strong> | Ngày tạo: {new Date(activeProposal.created_at).toLocaleDateString('vi-VN')}
            </div>
          </div>

          {/* Workflow Stepper */}
          <div className="workflow-steps">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Soạn phiếu</div>
            </div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Lãnh đạo phòng duyệt</div>
            </div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Giám đốc duyệt</div>
            </div>
            <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">Hoàn thành</div>
            </div>
          </div>

          {/* Form sections */}
          <div className="form-sections">
            {/* Thông tin chung */}
            <div className="form-section">
              <h3>Thông tin chung</h3>
              <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label>Tiêu đề đề xuất *</label>
              <input 
                value={activeProposal.title || ''} 
                onChange={e => setActiveProposal({...activeProposal, title: e.target.value})} 
                placeholder="VD: Đề xuất mua máy tính cho phòng CNTT..."
                disabled={!isEditable}
              />
            </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Đơn vị đề xuất</label>
              <select 
                value={activeProposal.department_id || ''} 
                onChange={e => setActiveProposal({...activeProposal, department_id: e.target.value})}
                disabled={!isEditable}
              >
                <option value="">-- Chọn phòng ban --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Người đề xuất</label>
              <input value={activeProposal.requester_name || user?.fullName || ''} readOnly style={{backgroundColor: '#f5f5f5'}} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Ngày đề xuất</label>
              <input value={new Date(activeProposal.created_at).toLocaleDateString('vi-VN')} readOnly style={{backgroundColor: '#f5f5f5'}} />
                </div>
              </div>
            </div>

            {/* Danh sách tài sản */}
            <div className="form-section">
              <h3>Danh sách tài sản đề xuất mua</h3>
              <div className="table-responsive">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên TS/Vật tư</th>
                      <th>Đặc tính kỹ thuật</th>
                      <th>ĐVT</th>
                      <th>SL</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                      {isEditable && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                {Array.isArray(activeProposal.items) && activeProposal.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input disabled={!isEditable} value={item.name || ''} onChange={e => updateItem(index, 'name', e.target.value)} placeholder="Tên tài sản" />
                    </td>
                    <td>
                      <input disabled={!isEditable} value={item.spec || ''} onChange={e => updateItem(index, 'spec', e.target.value)} placeholder="Đặc tính kỹ thuật" />
                    </td>
                    <td>
                      <input disabled={!isEditable} value={item.unit || ''} onChange={e => updateItem(index, 'unit', e.target.value)} placeholder="ĐVT" style={{width: '70px'}} />
                    </td>
                    <td>
                      <input disabled={!isEditable} type="number" min="1" value={item.quantity || 1} onChange={e => updateItem(index, 'quantity', e.target.value)} style={{width: '70px'}} />
                    </td>
                    <td>
                      <input disabled={!isEditable} type="number" value={item.unit_price || 0} onChange={e => updateItem(index, 'unit_price', e.target.value)} />
                    </td>
                    <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((item.quantity || 0) * (item.unit_price || 0))}</td>
                    {isEditable && <td><button className="btn btn-danger btn-sm" onClick={() => removeItem(index)}>✕</button></td>}
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>
          {isEditable && <button className="btn btn-outline mt-2" onClick={addItem}>+ Thêm dòng</button>}
              <div className="totals">
            <div>Tạm tính: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activeProposal.total_amount || 0)}</strong></div>
            <div>Thuế VAT (10%): <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((activeProposal.total_amount || 0) * 0.1)}</strong></div>
            <div className="grand-total">Tổng cộng: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((activeProposal.total_amount || 0) * 1.1)}</strong></div>
              </div>
            </div>

            {/* Lý do */}
            <div className="form-section">
              <h3>Lý do & mô tả bổ sung</h3>
              <div className="form-group">
                <label>Lý do đề xuất mua sắm</label>
            <textarea disabled={!isEditable} rows="4" value={activeProposal.description || ''} onChange={e => setActiveProposal({...activeProposal, description: e.target.value})} placeholder="Nhập lý do..." />
              </div>
            </div>
          </div>

          {/* Tài liệu đính kèm */}
          <div className="form-section">
            <h3>Tài liệu đính kèm</h3>
            <div className="form-group">
              {isEditable ? (
                <>
                  <label>File báo giá / Hình ảnh tham khảo (nếu có)</label>
                  <input 
                    type="file" 
                    onChange={(e) => setAttachedFile(e.target.files[0])}
                    className="form-control"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', width: '100%', background: '#fff' }}
                  />
                  {attachedFile && (
                    <div style={{ marginTop: '10px', fontSize: '14px', color: '#166534' }}>
                      ✓ Đã chọn file mới: <strong>{attachedFile.name}</strong> ({(attachedFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </>
              ) : (
                <label>Tài liệu đính kèm hiện tại</label>
              )}
              
              {activeProposal.attached_file_url && (
                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                  <button 
                    onClick={() => handleViewFile(activeProposal.attached_file_url)}
                    className="btn btn-sm btn-primary"
                  >
                    📄 Xem / Tải tài liệu đính kèm
                  </button>
                </div>
              )}

              {!isEditable && !activeProposal.attached_file_url && (
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>
                  Không có tài liệu đính kèm nào được cung cấp.
                </div>
              )}
            </div>
          </div>

          {/* Ký duyệt */}
          <div className="signoff-section">
            <h3>Ký duyệt</h3>
            <div className="signoff-grid">
              <div className="signoff-item">
                <label>Người đề xuất</label>
                <div className="signature-area">
                  <span>Ký và ghi rõ họ tên</span>
                  <div className="signature-line">_______________________</div>
                <div>{activeProposal.requester_name || user?.fullName}</div>
                </div>
              </div>
              <div className="signoff-item">
                <label>Lãnh đạo phòng</label>
                <div className="signature-area">
                  <span>Xác nhận nhu cầu</span>
                  <div className="signature-line">_______________________</div>
                  <div>{activeProposal.department_leader_name}</div>
                </div>
              </div>
              {/* <div className="signoff-item">
                <label>Phòng Tài chính</label>
                <div className="signature-area">
                  <span>Xác nhận kinh phí</span>
                  <div className="signature-line">_______________________</div>
                </div>
              </div> */}
              <div className="signoff-item">
                <label>Ban Giám đốc</label>
                <div className="signature-area">
                  <span>Phê duyệt</span>
                  <div className="signature-line">_______________________</div>
                  <div>{activeProposal.director_name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
      {(!activeProposal.id || ['draft', 'rejected'].includes(activeProposal.status)) && (
        <div className="action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-outline" onClick={() => setSearchParams({})}>Hủy</button>
          <button className="btn btn-secondary" onClick={() => handleSave('draft')}>Lưu nháp</button>
          <button className="btn btn-primary" onClick={() => handleSave('department_pending')}>Gửi duyệt ↗</button>
        </div>
      )}

          {/* Current workflow position */}
          <div className="workflow-current">
            <div className="stepper">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                <div>Soạn phiếu</div>
              </div>
              <div className="step-arrow">›</div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                <div>Lãnh đạo phòng duyệt</div>
              </div>
              <div className="step-arrow">›</div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                <div>Giám đốc duyệt</div>
              </div>
              <div className="step-arrow">›</div>
              <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
                <div>Hoàn thành</div>
              </div>
            </div>
          </div>

          {/* Processing sidebar */}
      {showApprovalSidebar && (
        <div className="processing-sidebar">
          <h4>Thao tác phê duyệt</h4>
          <div className="comment-area">
            <label>Ý kiến / Ghi chú</label>
            <textarea id="approval-comment" placeholder="Nhập nhận xét (nếu có)..."></textarea>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleSave('draft')}>← Trả lại</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleSave('rejected')}>Từ chối</button>
            <button className="btn btn-success" style={{ flex: 1 }} onClick={() => {
                if (activeProposal.status === 'department_pending') handleSave('director_pending');
                else handleSave('approved');
              }}>Phê duyệt</button>
          </div>
        </div>
      )}

          {/* History */}
      {activeProposal.id && (
        <div className="history-section">
          <h4>Lịch sử xử lý</h4>
          {history.map((item, index) => (
            <div key={index} className={`history-item ${item.status === 'Đã phê duyệt' || item.status === 'Hoàn thành' ? 'approved' : ''}`}>
              <div className="history-step">{item.step} — {item.handler}</div>
              <div className="history-role">{item.role}</div>
              <div className="history-date">{item.date && `${item.status} · ${item.date}`}</div>
              {item.comment && <div className="history-comment">"{item.comment}"</div>}
            </div>
          ))}
        </div>
      )}
        </div>
      )}

    </div>
  );
};

export default PurchaseProposalPage;
