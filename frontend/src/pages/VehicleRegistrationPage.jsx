/**
 * VehicleRegistrationPage
 *
 * Quản lý việc đăng ký và xem lịch trình sử dụng xe.
 * Luồng xử lý phiếu: pending (chờ lãnh đạo duyệt) -> approved (chờ điều phối gán xe)
 *                     -> scheduled (đã gán xe, hiển thị Lịch tuần).
 * - Người có CREATE_VEHICLE_REGISTRATION: tạo phiếu, chỉ gửi thông tin (không chọn xe).
 *   Nếu có phiếu khác cùng ngày/giờ/điểm đến đã được duyệt, hệ thống gợi ý ghép chuyến.
 * - Người có APPROVE_VEHICLE_REGISTRATION (lãnh đạo): duyệt hoặc từ chối phiếu 'pending'.
 * - Người có COORDINATE_VEHICLE (điều phối): gán xe cụ thể cho phiếu 'approved' (hoặc từ chối
 *   nếu không sắp được xe) -> phiếu chuyển 'scheduled' và hiện trên Lịch tuần.
 * - Sửa nội dung phiếu: chỉ khi đang 'pending' hoặc 'rejected' (sửa khi 'rejected' = nộp lại,
 *   tự chuyển về 'pending'). Sau khi đã duyệt, phải được từ chối ("trả về") trước mới sửa được.
 * - Chế độ 'list': quyền VIEW_VEHICLE_REGISTRATIONS, hiển thị mọi trạng thái.
 * - Chế độ 'week': quyền VIEW_VEHICLE_WEEKLY, chỉ hiển thị phiếu 'scheduled'.
 * - Lọc dữ liệu theo phòng ban (nếu không có quyền xem toàn công ty) do Backend tự thực thi.
 */
import { useState, useEffect } from 'react';
import { vehicleRegistrationsAPI, usersAPI, departmentsAPI, vehiclesAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const STATUS_LABELS = {
  pending: { icon: '⏳', color: '#f7f2f0', bg: '#fff3e0', tooltip: 'Chờ duyệt' },
  approved: { icon: '👤', color: '#fcfcfc', bg: '#e3f2fd', tooltip: 'Chờ gán xe' },
  scheduled: { icon: '📅', color: '#f7f8f7', bg: '#e8f5e9', tooltip: 'Đã lên lịch' },
  rejected: { icon: '❌', color: '#f5f4f4', bg: '#ffebee', tooltip: 'Từ chối' },
  cancelled: { icon: '🚫', color: '#f7f4f4', bg: '#f5f5f5', tooltip: 'Đã hủy' },
};

// Helper để format ngày về YYYY-MM-DD theo giờ địa phương (tránh lỗi lệch ngày do múi giờ)
const formatDateForInput = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
// Helper để format ngày hiển thị theo chuẩn VN (dd/mm/yyyy), an toàn với dữ liệu bẩn/null
const formatDateForDisplay = (dateInput) => {
  if (!dateInput || dateInput === '') return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};
// Helper để đếm số lượng thành phần tham gia từ chuỗi participants
const countParticipants = (participants) => {
  if (!participants || participants.trim() === '') return 0;
  return participants.split(',').filter(p => p.trim() !== '').length;
};

const VehicleRegistrationPage = () => {
  const { user, loading: authLoading } = useAuth();
  
  const [viewMode, setViewMode] = useState('list'); // 'list' hoặc 'week'
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  
  // Các state bị thiếu
  const [registrations, setRegistrations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [DepartmentsList, setDepartmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRegistration, setCurrentRegistration] = useState({
    departure_location: 'MBS Office',
    requester_id: user?.id || '',
    registration_date: formatDateForInput(new Date()),
    departure_time: '',
    destination: '',
    participants: '',
    notes: '',
    department_ids: []
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [mergeCandidates, setMergeCandidates] = useState([]);
  const [checkingMerge, setCheckingMerge] = useState(false);

  // Trạng thái cho phép truy cập
  const isAuthenticated = !!user;
  
  const canViewRegistrations = isAuthenticated;
  const canViewWeekly = isAuthenticated;
  const canCreateRegistration = isAuthenticated;
  const canEditRegistration = isAuthenticated && (user?.role === 'admin' || user?.permissions?.includes('EDIT_VEHICLE_REGISTRATION'));
  const canDeleteRegistration = isAuthenticated && (user?.role === 'admin' || user?.permissions?.includes('DELETE_VEHICLE_REGISTRATION'));
  const canCoordinate = isAuthenticated && (user?.role === 'admin' || user?.permissions?.includes('COORDINATE_VEHICLE'));
  const canApprove = isAuthenticated && (user?.role === 'admin' || user?.permissions?.includes('APPROVE_VEHICLE_REGISTRATION'));
  
  const hasActions = canEditRegistration || canDeleteRegistration || canCoordinate || canApprove;

  useEffect(() => {
    if (authLoading) return; // Đợi AuthContext tải xong
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    // Nếu mặc định là list nhưng không có quyền xem list, tự chuyển sang tuần (nếu cần)
    if (viewMode === 'list' && !canViewRegistrations && canViewWeekly) {
      setViewMode('week');
      return; // Sẽ trigger useEffect lại với viewMode mới
    }

    fetchVehicles(); // Tải danh sách xe cho bước gán xe

    if (viewMode === 'list' && canViewRegistrations) {
      fetchRegistrations();
    } else if (viewMode === 'week' && canViewWeekly) {
      fetchWeekRegistrations();
    }

    fetchUsers();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, viewMode, currentWeekStart]);

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesAPI.getAll();
      const data = response.data.data || response.data;
      setVehiclesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };
  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getAllSimple();
      const data = response.data.data || response.data;
      setDepartmentsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      // Theo thiết kế: mọi người dùng đã xác thực đều xem được toàn bộ danh sách đăng ký xe,
      // không lọc theo phòng ban riêng (backend cũng không ép filter này - xem getAllVehicleRegistrations).
      const params = {};
      const response = await vehicleRegistrationsAPI.getAll(params);
      setRegistrations(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách đăng ký xe.');
      console.error('Error fetching vehicle registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekRegistrations = async () => {
    setLoading(true);
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Sunday

    try {
      // Theo thiết kế: mọi người dùng đã xác thực đều xem được toàn bộ lịch tuần, không lọc theo phòng ban.
      const params = {
        startDate: formatDateForInput(start),
        endDate: formatDateForInput(end),
        status: 'scheduled', // Lịch tuần chỉ hiển thị phiếu đã được gán xe (chốt lịch)
        limit: 100
      };
      const response = await vehicleRegistrationsAPI.getAll(params);
      setRegistrations(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải lịch tuần.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAllSimple();
      setUsersList(res.data);
    } catch (err) { console.error(err); }
  };

  const resetCreateForm = () => ({
    departure_location: 'MBS Office',
    requester_id: user?.id || '',
    registration_date: formatDateForInput(new Date()),
    departure_time: '',
    destination: '',
    participants: '',
    notes: '',
    department_ids: []
  });

  const handleAddClick = () => {
    setIsEditing(false);
    setCurrentRegistration(resetCreateForm());
    setMergeCandidates([]);
    setShowModal(true);
  };

  const handleEditClick = (registration) => {
    setIsEditing(true);
    setCurrentRegistration({
      ...registration,
      registration_date: formatDateForInput(registration.registration_date),
      departure_location: registration.departure_location || 'MBS Office',
      departure_time: registration.departure_time || '',
      destination: registration.destination || '',
      participants: registration.participants || '',
      department_ids: registration.department_ids || []
    });
    setMergeCandidates([]);
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đăng ký xe này?')) return;
    try {
      await vehicleRegistrationsAPI.delete(id);
      alert('Xóa đăng ký xe thành công!');
      reloadCurrentView();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa đăng ký xe.');
      console.error('Error deleting vehicle registration:', err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!currentRegistration.department_ids || currentRegistration.department_ids.length === 0) {
      alert('Vui lòng chọn ít nhất một phòng ban tham gia.');
      return;
    }
    try {
      if (isEditing) {
        const res = await vehicleRegistrationsAPI.update(currentRegistration.id, currentRegistration);
        alert(res.data?.message || 'Cập nhật đăng ký xe thành công!');
        setShowModal(false);
      } else {
        const res = await vehicleRegistrationsAPI.create(currentRegistration);
        const newId = res.data.id;
        alert('Gửi yêu cầu đăng ký xe thành công! Đang chờ lãnh đạo duyệt.');
        setShowModal(false);
        // Nếu có file đính kèm, upload ngay sau khi tạo phiếu thành công
        if (selectedFile && newId) {
          setUploadingFile(true);
          try {
            const formData = new FormData();
            formData.append('attachment', selectedFile);
            await vehicleRegistrationsAPI.uploadAttachment(newId, formData);
            alert('Tải file đính kèm thành công!');
          } catch (uploadErr) {
            console.error('Error uploading attachment after create:', uploadErr);
            alert('Phiếu đã tạo nhưng không thể tải file đính kèm. Bạn có thể tải lên sau qua chức năng Sửa.');
          } finally {
            setUploadingFile(false);
            setSelectedFile(null);
          }
        }
      }
      reloadCurrentView();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi lưu đăng ký xe.');
      console.error('Error saving vehicle registration:', err);
    }
  };

  const reloadCurrentView = () => {
    if (viewMode === 'list') fetchRegistrations();
    else if (viewMode === 'week') fetchWeekRegistrations();
  };

// --- Gợi ý ghép chuyến ---
  // Khi người dùng đã điền Ngày + Điểm đến, kiểm tra xem có phiếu
  // nào cùng ngày/điểm đến đã được duyệt sẵn (approved/scheduled) hay không.
  // Chỉ cần cùng NGÀY + ĐIỂM ĐẾN là đủ (không bắt buộc trùng giờ).
  const handleCheckMerge = async () => {
    const { registration_date, destination } = currentRegistration;
    if (!registration_date || !destination) return;
    setCheckingMerge(true);
    try {
      // Backend findMergeCandidates đã bỏ điều kiện departure_time
      const res = await vehicleRegistrationsAPI.getMergeSuggestions({ registration_date, destination });
      setMergeCandidates(res.data.data || []);
    } catch (err) {
      console.error('Error checking merge suggestions:', err);
    } finally {
      setCheckingMerge(false);
    }
  };

  const handleJoinCandidate = async (candidate) => {
    if (!currentRegistration.department_ids || currentRegistration.department_ids.length === 0) {
      alert('Vui lòng chọn phòng ban tham gia trước khi ghép chuyến.');
      return;
    }
    if (!window.confirm(`Tham gia (ghép chuyến) vào phiếu ${candidate.registration_number} đi ${candidate.destination} thay vì tạo phiếu mới?`)) return;
    try {
      // Gửi kèm participants để cộng dồn vào chuyến đã có
      await vehicleRegistrationsAPI.join(
        candidate.id,
        currentRegistration.department_ids,
        currentRegistration.notes,
        currentRegistration.participants
      );
      alert('Ghép chuyến thành công. Không cần chờ duyệt lại vì chuyến đã được phê duyệt.');
      setShowModal(false);
      setMergeCandidates([]);
      reloadCurrentView();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi ghép chuyến.');
      console.error('Error joining vehicle registration:', err);
    }
  };

  // Bước 1: Lãnh đạo (APPROVE_VEHICLE_REGISTRATION) duyệt phiếu đang 'pending'
  const handleApprove = async (registration) => {
    if (!window.confirm(`Duyệt yêu cầu ${registration.registration_number} đi ${registration.destination}?`)) return;
    try {
      await vehicleRegistrationsAPI.approve(registration.id);
      alert('Duyệt yêu cầu thành công. Đang chờ điều phối gán xe.');
      reloadCurrentView();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi duyệt đăng ký xe.');
      console.error('Error approving vehicle registration:', err);
    }
  };

  // Bước 2: Điều phối viên (COORDINATE_VEHICLE) mở modal chọn xe cho phiếu đã 'approved'
  const handleOpenAssign = (registration) => {
    setAssignTarget(registration);
    setSelectedVehicleId(registration.vehicle_id || '');
  };

  const handleConfirmAssign = async () => {
    if (!selectedVehicleId) {
      alert('Vui lòng chọn xe.');
      return;
    }
    try {
      await vehicleRegistrationsAPI.assignVehicle(assignTarget.id, selectedVehicleId);
      alert('Gán xe thành công. Đã hiển thị trong Lịch tuần.');
      setAssignTarget(null);
      reloadCurrentView();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gán xe.');
      console.error('Error assigning vehicle:', err);
    }
  };

  // Từ chối phiếu ở bước 'pending' (lãnh đạo) hoặc 'approved' (điều phối, VD hết xe)
  const handleReject = async (registration) => {
    const reason = window.prompt(`Lý do từ chối phiếu ${registration.registration_number} (có thể để trống):`, '');
    if (reason === null) return; // Người dùng bấm Hủy
    try {
      await vehicleRegistrationsAPI.reject(registration.id, reason);
      alert('Đã từ chối đăng ký xe.');
      reloadCurrentView();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi từ chối đăng ký xe.');
      console.error('Error rejecting vehicle registration:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentRegistration(prev => ({ ...prev, [name]: value }));
  };

  // --- File đính kèm ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

const handleUploadFile = async (registrationId) => {
    if (!selectedFile) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('attachment', selectedFile);
      const res = await vehicleRegistrationsAPI.uploadAttachment(registrationId, formData);
      alert('Tải file đính kèm thành công!');
      setSelectedFile(null);
      // Cập nhật currentRegistration để hiển thị file mới trong modal
      if (res.data && res.data.data) {
        setCurrentRegistration(prev => ({
          ...prev,
          attachment_path: res.data.data.attachment_path,
          document_name: res.data.data.document_name
        }));
      }
      reloadCurrentView();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tải file đính kèm.');
      console.error('Error uploading attachment:', err);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (registrationId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa file đính kèm này?')) return;
    try {
      await vehicleRegistrationsAPI.deleteAttachment(registrationId);
      alert('Xóa file đính kèm thành công!');
      reloadCurrentView();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa file đính kèm.');
      console.error('Error deleting attachment:', err);
    }
  };

  const handleDeptToggle = (deptId) => {
    setCurrentRegistration(prev => {
      const currentDepts = prev.department_ids || [];
      if (currentDepts.includes(deptId)) {
        return { ...prev, department_ids: currentDepts.filter(id => id !== deptId) };
      } else {
        return { ...prev, department_ids: [...currentDepts, deptId] };
      }
    });
  };

  const getDaysOfWeek = () => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  };

  const changeWeek = (offset) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + offset * 7);
    setCurrentWeekStart(newDate);
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!canViewRegistrations && !canViewWeekly) return <div className="error-message">Bạn không có quyền truy cập trang này.</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Quản lý Đăng ký xe</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="btn-group">
            {canViewRegistrations && (
              <button
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('list')}
              >
                Danh sách
              </button>
            )}
            {canViewWeekly && (
              <button
                className={`btn btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('week')}
              >
                Lịch tuần
              </button>
            )}
          </div>
          {canCreateRegistration && (
            <button className="btn btn-primary" onClick={handleAddClick}>+ Thêm Đăng ký xe</button>
          )}
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="calendar-controls" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="btn btn-sm btn-outline" onClick={() => changeWeek(-1)}>‹ Tuần trước</button>
          <strong style={{ minWidth: '200px', textAlign: 'center' }}>
            Tuần: {getDaysOfWeek()[0].toLocaleDateString('vi-VN')} - {getDaysOfWeek()[6].toLocaleDateString('vi-VN')}
          </strong>
          <button className="btn btn-sm btn-outline" onClick={() => changeWeek(1)}>Tuần sau ›</button>
          <button className="btn btn-sm btn-outline" onClick={() => setCurrentWeekStart(new Date())}>Hôm nay</button>
        </div>
      )}

      {viewMode === 'list' ? (
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Xe / Biển số</th>
                <th>Phòng ban</th>
                <th>Người đăng ký</th>
                <th>Điểm đi</th>
                <th>Thời gian</th>
                <th>Thời gian xuất phát</th>
                <th>Địa điểm đến</th>
                <th>Thành phần tham gia</th>
                <th>Ghi chú</th>
                <th>File đính kèm</th>
                <th>Trạng thái</th>
                {hasActions && <th>Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={hasActions ? 11 : 10} style={{ textAlign: 'center' }}>Không có dữ liệu đăng ký.</td>
                </tr>
              ) : (
                registrations.map(reg => {
                  const statusInfo = STATUS_LABELS[reg.status] || { text: reg.status, color: '#333', bg: '#eee' };
                  // Cho phép sửa nếu:
                  // - Có quyền EDIT_VEHICLE_REGISTRATION (admin hoặc role được cấp) VÀ phiếu đang pending/rejected
                  // - HOẶC là người tạo phiếu và phiếu đang bị từ chối (rejected) — để họ có thể nộp lại
                  const isOwner = reg.requester_id === user?.id;
                  const canEditThis = (canEditRegistration && ['pending', 'rejected'].includes(reg.status)) ||
                                      (isOwner && reg.status === 'rejected');
                  return (
                  <tr key={reg.id}>
                    <td>{reg.plate_number ? <strong>{reg.plate_number}</strong> : <em style={{ color: '#999' }}>Chưa gán</em>} ({reg.brand || '-'})</td>
                    <td>{reg.department_names || '-'}</td>
                    <td>{reg.requester_name}</td>
                    <td>{reg.departure_location || '-'}</td>
                    <td>{formatDateForDisplay(reg.registration_date || '-')}</td>
                    <td>{reg.departure_time || '-'}</td>
                    <td>{reg.destination || '-'}</td>
                    <td>{reg.participants || '-'}</td>
                    <td>{reg.notes || '-'}</td>
                    <td>
                      {reg.attachment_path ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <a
                            href={vehicleRegistrationsAPI.getAttachmentUrl(reg.attachment_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.85em', color: '#1976d2', textDecoration: 'underline' }}
                            title={reg.document_name || 'Tải file'}
                          >
                            📎 {reg.document_name || reg.attachment_path}
                          </a>
                          {canEditThis && (
                            <button
                              onClick={() => handleDeleteFile(reg.id)}
                              className="btn btn-sm"
                              style={{ padding: '0 6px', fontSize: '0.75em', color: '#c62828', background: 'none', border: 'none', cursor: 'pointer' }}
                              title="Xóa file"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <em style={{ color: '#999', fontSize: '0.85em' }}>Không có</em>
                      )}
                    </td>
                    {/* <td>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.8em', fontWeight: 'bold', color: statusInfo.color, background: statusInfo.bg }}>
                        {statusInfo.text}
                      </span>
                    </td> */}
                    <td style={{ textAlign: 'center' }}>
                      <span 
                        title={STATUS_LABELS[reg.status]?.tooltip || reg.status}
                        style={{ 
                          fontSize: '18px', 
                          cursor: 'pointer',
                          // backgroundColor: STATUS_LABELS[reg.status]?.bg,
                          padding: '4px 8px',
                          borderRadius: '50%'
                        }}
                      >
                        {STATUS_LABELS[reg.status]?.icon || '❓'}
                      </span>
                    </td>
                    {hasActions && (
                      <td style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {canApprove && reg.status === 'pending' && (
                          <button className="btn btn-sm btn-primary" onClick={() => handleApprove(reg)}style={{ width: '100%' }}>Duyệt</button>
                        )}
                        {canCoordinate && reg.status === 'approved' && (
                          <button className="btn btn-sm btn-primary" onClick={() => handleOpenAssign(reg)}style={{ width: '100%' }}>Gán xe</button>
                        )}
                        {(canApprove || canCoordinate) && ['pending', 'approved'].includes(reg.status) && (
                          <button className="btn btn-sm btn-outline" onClick={() => handleReject(reg)}style={{ width: '100%' }}>Từ chối</button>
                        )}
                        {canEditThis && <button className="btn btn-sm btn-outline" onClick={() => handleEditClick(reg)}style={{ width: '100%' }}>Sửa</button>}
                        {canDeleteRegistration && <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(reg.id)}style={{ width: '100%' }}>Xóa</button>}
                      </td>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : viewMode === 'week' ? (
        <div className="table-container" style={{ padding: '5px' }}>
          <div className="week-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', minWidth: '900px' }}>
          {getDaysOfWeek().map((day, idx) => {
            const dateStr = formatDateForInput(day);
            const dayRegistrations = registrations.filter(r => formatDateForInput(r.registration_date) === dateStr);
            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div key={idx} className="card week-day" style={{ minHeight: '150px', borderTop: isToday ? '3px solid var(--color-primary)' : '' }}>
                <div className="day-header" style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px', color: isToday ? 'var(--color-primary)' : 'inherit' }}>
                  {day.toLocaleDateString('vi-VN', { weekday: 'short' })} <br/>
                  <span style={{ fontSize: '0.9em', fontWeight: 'normal' }}>{day.toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="day-content" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {dayRegistrations.map(reg => (
                    <div
                      key={reg.id}
                      style={{
                        fontSize: '0.85em',
                        padding: '4px 8px',
                        marginBottom: '4px',
                        background: 'var(--color-bg-light)',
                        borderRadius: '4px',
                        borderLeft: '3px solid var(--color-primary)'
                      }}
                      title={`${reg.plate_number || 'Chưa gán xe'} - ${reg.requester_name}`}
                    >
                      <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {reg.departure_time || '??:??'} - {reg.plate_number || 'Chờ gán'}
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>Địa điểm: {reg.destination}</div>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>Phòng: {reg.department_names}</div>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>Số lượng: {countParticipants(reg.participants)} người</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      ) : (
        null
      )}

      {showModal && ( // Modal Thêm/Sửa Đăng ký xe
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{isEditing ? 'Cập nhật Yêu cầu Đăng ký xe' : 'Tạo Yêu cầu Đăng ký xe mới'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Chọn phòng tham gia *</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      multiple={false}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      onChange={(e) => handleDeptToggle(Number(e.target.value))}
                      value=""
                    >
                      <option value="" disabled>-- Chọn phòng --</option>
                      {DepartmentsList.filter(dept =>
                        !(currentRegistration.department_ids || []).includes(dept.id)
                      ).map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>

                    {(currentRegistration.department_ids || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {(currentRegistration.department_ids || []).map(id => {
                          const dept = DepartmentsList.find(d => d.id === id);
                          return dept ? (
                            <span key={id} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '4px 10px', background: '#e3f2fd',
                              border: '1px solid #90caf9', borderRadius: '20px', fontSize: '0.85em'
                            }}>
                              {dept.name}
                              <button
                                type="button"
                                onClick={() => handleDeptToggle(id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', fontWeight: 'bold', padding: '0 2px' }}
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Điểm đi *</label>
                  <input type="text" name="departure_location" value={currentRegistration.departure_location} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Ngày khởi hành *</label>
                  <input type="date" name="registration_date" value={currentRegistration.registration_date} onChange={handleChange} onBlur={handleCheckMerge} required />
                </div>
                <div className="form-group">
                  <label>Thời gian khởi hành *</label>
                  <input type="time" name="departure_time" value={currentRegistration.departure_time} onChange={handleChange} onBlur={handleCheckMerge} required />
                </div>
                <div className="form-group">
                  <label>Địa điểm đến *</label>
                  <input type="text" name="destination" value={currentRegistration.destination} onChange={handleChange} onBlur={handleCheckMerge} required />
                </div>

                {!isEditing && checkingMerge && (
                  <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '10px' }}>Đang kiểm tra chuyến đi trùng lịch...</div>
                )}
                {!isEditing && mergeCandidates.length > 0 && (
                  <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px' }}>
                    <strong style={{ fontSize: '0.9em' }}>💡 Đã có chuyến đi tương tự được duyệt — bạn có thể ghép chuyến thay vì tạo phiếu mới:</strong>
                    {mergeCandidates.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '6px 8px', background: '#fff', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.85em' }}>
                          <strong>{c.registration_number}</strong> — {c.destination} lúc {c.departure_time || '?'}<br/>
                          <span style={{ color: '#666' }}>
                            {c.requester_name} ({c.department_names || 'chưa rõ phòng'}) · Xe: {c.plate_number || 'chưa gán'} · {STATUS_LABELS[c.status]?.text || c.status}
                          </span>
                        </div>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleJoinCandidate(c)}>Ghép chuyến này</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-group">
                  <label>Thành phần tham gia</label>
                  <input type="text" name="participants" value={currentRegistration.participants} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea name="notes" value={currentRegistration.notes} onChange={handleChange}></textarea>
                </div>
                <div className="form-group">
                  <label>File đính kèm</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.csv"
                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9em' }}
                    />
                    {isEditing && currentRegistration.id && selectedFile && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleUploadFile(currentRegistration.id)}
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? 'Đang tải...' : 'Tải lên'}
                      </button>
                    )}
                  </div>
                  {isEditing && currentRegistration.attachment_path && (
                    <div style={{ marginTop: '6px', fontSize: '0.85em' }}>
                      <a
                        href={vehicleRegistrationsAPI.getAttachmentUrl(currentRegistration.attachment_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1976d2' }}
                      >
                        📎 File hiện tại: {currentRegistration.document_name || currentRegistration.attachment_path}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(currentRegistration.id)}
                        className="btn btn-sm"
                        style={{ marginLeft: '8px', padding: '0 6px', fontSize: '0.75em', color: '#c62828', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        ✕ Xóa
                      </button>
                    </div>
                  )}
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

      {assignTarget && ( // Modal Gán xe (bước điều phối, sau khi đã được lãnh đạo duyệt)
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Gán xe cho phiếu {assignTarget.registration_number}</h2>
              <button onClick={() => setAssignTarget(null)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9em', color: '#555' }}>
                Đi <strong>{assignTarget.destination}</strong> ngày {formatDateForDisplay(assignTarget.registration_date)} lúc {assignTarget.departure_time || '?'} — Người đăng ký: {assignTarget.requester_name}
              </p>
              <div className="form-group">
                <label>Chọn xe *</label>
                <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}>
                  <option value="">-- Chọn xe --</option>
                  {vehiclesList.map(v => (
                    <option key={v.id} value={v.id} disabled={v.status === 'maintenance' || v.status === 'retired'}>
                      {v.plate_number} - {v.brand} {v.model} {v.status !== 'available' ? `(${v.status})` : ''}
                    </option>
                  ))}
                </select>
                {vehiclesList.length === 0 && (
                  <small style={{ color: 'red' }}>⚠️ Không tìm thấy xe nào trong hệ thống.</small>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setAssignTarget(null)} className="btn btn-outline">Hủy</button>
              <button type="button" onClick={handleConfirmAssign} className="btn btn-primary">Xác nhận gán xe</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleRegistrationPage;