import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { purchaseProposalsAPI, departmentsAPI } from '../api';
import { useSearchParams } from 'react-router-dom';

const PurchaseProposalPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [activeProposal, setActiveProposal] = useState(null);
  const [history, setHistory] = useState([]);

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
    } else {
      setActiveProposal(null);
      fetchProposalsList();
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
      setActiveProposal(response.data);
      generateHistory(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHistory = (proposal) => {
    const hist = [];
    
    hist.push({
      step: 'Soạn phiếu',
      handler: proposal.requester_name || 'Người đề xuất',
      role: 'Người đề xuất',
      date: new Date(proposal.created_at).toLocaleDateString('vi-VN'),
      status: 'Đã gửi',
      comment: ''
    });

    if (proposal.department_leader_id) {
      const isRejectedAtDept = proposal.status === 'rejected' && !proposal.director_id;
      hist.push({
        step: 'Lãnh đạo phòng duyệt',
        handler: proposal.department_leader_name || 'Trưởng phòng',
        role: 'Lãnh đạo phòng',
        date: proposal.updated_at ? new Date(proposal.updated_at).toLocaleDateString('vi-VN') : '',
        status: isRejectedAtDept ? 'Từ chối' : 'Đã phê duyệt',
        comment: proposal.department_comment || ''
      });
    }

    if (proposal.director_id) {
      hist.push({
        step: 'Giám đốc duyệt',
        handler: proposal.director_name || 'Giám đốc',
        role: 'Ban Giám đốc',
        date: proposal.updated_at ? new Date(proposal.updated_at).toLocaleDateString('vi-VN') : '',
        status: proposal.status === 'rejected' ? 'Từ chối' : 'Đã phê duyệt',
        comment: proposal.director_comment || ''
      });
    }

    if (proposal.status === 'approved') {
      hist.push({
        step: 'Hoàn tất',
        handler: 'Hệ thống',
        role: 'Tự động',
        date: proposal.updated_at ? new Date(proposal.updated_at).toLocaleDateString('vi-VN') : '',
        status: 'Hoàn thành',
        comment: 'Phiếu đề xuất mua sắm đã được phê duyệt thành công.'
      });
    }

    setHistory(hist);
  };

  const updateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const addItem = () => {
    const newItems = [...activeProposal.items, { name: '', spec: '', unit: 'Chiếc', quantity: 1, unit_price: 0 }];
    setActiveProposal({
      ...activeProposal,
      items: newItems,
      total_amount: updateTotal(newItems),
      total_vat: updateTotal(newItems) * 0.1
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...activeProposal.items];
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
  };

  const removeItem = (index) => {
    const newItems = activeProposal.items.filter((_, i) => i !== index);
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
              <div className="grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Tiêu đề đề xuất *</label>
              <input 
                value={activeProposal.title || ''} 
                onChange={e => setActiveProposal({...activeProposal, title: e.target.value})} 
                placeholder="VD: Đề xuất mua máy tính cho phòng CNTT..."
              />
            </div>
                <div className="form-group">
                  <label>Đơn vị đề xuất</label>
              <select 
                value={activeProposal.department_id || ''} 
                onChange={e => setActiveProposal({...activeProposal, department_id: e.target.value})}
              >
                <option value="">-- Chọn phòng ban --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Người đề xuất</label>
              <input value={activeProposal.requester_name || user?.fullName || ''} readOnly style={{backgroundColor: '#f5f5f5'}} />
                </div>
                <div className="form-group">
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                {activeProposal.items?.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input value={item.name || ''} onChange={e => updateItem(index, 'name', e.target.value)} placeholder="Tên tài sản" />
                    </td>
                    <td>
                      <input value={item.spec || ''} onChange={e => updateItem(index, 'spec', e.target.value)} placeholder="Đặc tính kỹ thuật" />
                    </td>
                    <td>
                      <input value={item.unit || ''} onChange={e => updateItem(index, 'unit', e.target.value)} placeholder="ĐVT" style={{width: '70px'}} />
                    </td>
                    <td>
                      <input type="number" min="1" value={item.quantity || 1} onChange={e => updateItem(index, 'quantity', e.target.value)} style={{width: '70px'}} />
                    </td>
                    <td>
                      <input type="number" value={item.unit_price || 0} onChange={e => updateItem(index, 'unit_price', e.target.value)} />
                    </td>
                    <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((item.quantity || 0) * (item.unit_price || 0))}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => removeItem(index)}>✕</button></td>
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>
          <button className="btn btn-outline mt-2" onClick={addItem}>+ Thêm dòng</button>
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
            <textarea rows="4" value={activeProposal.description || ''} onChange={e => setActiveProposal({...activeProposal, description: e.target.value})} placeholder="Nhập lý do..." />
              </div>
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
                <label>Trưởng bộ phận</label>
                <div className="signature-area">
                  <span>Xác nhận nhu cầu</span>
                  <div className="signature-line">_______________________</div>
                </div>
              </div>
              <div className="signoff-item">
                <label>Phòng Tài chính</label>
                <div className="signature-area">
                  <span>Xác nhận kinh phí</span>
                  <div className="signature-line">_______________________</div>
                </div>
              </div>
              <div className="signoff-item">
                <label>Ban Giám đốc</label>
                <div className="signature-area">
                  <span>Phê duyệt</span>
                  <div className="signature-line">_______________________</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
      {(!activeProposal.id || ['draft', 'rejected'].includes(activeProposal.status)) && (
        <div className="action-buttons">
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
      {activeProposal.id && activeProposal.status !== 'approved' && activeProposal.status !== 'draft' && (
        <div className="processing-sidebar">
          <h4>Thao tác phê duyệt</h4>
          <div className="comment-area">
            <label>Ý kiến / Ghi chú</label>
            <textarea id="approval-comment" placeholder="Nhập nhận xét (nếu có)..."></textarea>
          </div>
          {(user?.role === 'admin' || 
            (activeProposal.status === 'department_pending' && user?.role === 'department-leader') ||
            (activeProposal.status === 'director_pending' && user?.role === 'director')) && (
            <div className="flex gap-2 mt-4">
              <button className="btn btn-outline flex-1" onClick={() => handleSave('draft')}>← Trả lại</button>
              <button className="btn btn-danger flex-1" onClick={() => handleSave('rejected')}>Từ chối</button>
              <button className="btn btn-success flex-1" onClick={() => {
                if (activeProposal.status === 'department_pending') handleSave('director_pending');
                else handleSave('approved');
              }}>Phê duyệt</button>
            </div>
          )}
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
