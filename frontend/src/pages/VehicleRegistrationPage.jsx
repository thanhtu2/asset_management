/**
 * VehicleRegistrationPage
 * 
 * Quản lý việc đăng ký và xem lịch trình sử dụng xe.
 * - Chế độ 'list': Yêu cầu quyền VIEW_VEHICLE_REGISTRATIONS.
 * - Chế độ 'week': Yêu cầu quyền VIEW_VEHICLE_WEEKLY.
 * - Tự động lọc dữ liệu theo phòng ban nếu không có quyền COORDINATE_VEHICLE.
 * - Hiển thị dữ liệu đăng ký trực tiếp lên lưới lịch 7 ngày.
 */
import { useState, useEffect, useRef } from 'react';
import { vehicleRegistrationsAPI, usersAPI, departmentsAPI, vehiclesAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

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
// Helper để format ngày về DD/MM/YYYY cho hiển thị
const formatDateForDisplay = (dateInput) => {
  if (!dateInput) return '';
  
  // Xử lý trường hợp YYYY-MM-DD (dễ bị lệch múi giờ)
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const parts = dateInput.split('T')[0].split('-');
    return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
  }
  
  // Xử lý trường hợp ISO String hoặc các dạng date khác
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  
  // Dùng UTC để tránh lệch múi giờ của trình duyệt
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const year = d.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
};

// Helper để đếm số lượng thành phần tham gia từ chuỗi participants
const countParticipants = (participants) => {
  if (!participants || participants.trim() === '') return 0;
  return participants.split(',').filter(p => p.trim() !== '').length;
};
const VehicleRegistrationPage = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]); // Thêm danh sách xe
  const [DepartmentsList, setDepartmentsList] = useState([]); // Thêm danh sách phòng ban
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'week', or 'trips'
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [activeDropdownId, setActiveDropdownId] = useState(null); // State để quản lý dropdown đóng mở
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  // State cho modal đăng ký xe
  const [isEditing, setIsEditing] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null); // Khai báo state bị thiếu
  const [changePreviewModal, setChangePreviewModal] = useState({ show: false, original: null, requested: null }); // Modal xem chi tiết yêu cầu thay đổi (chỉ điều phối viên)
  // State cho modal gợi ý ghép chuyến đi
  const [similarTrips, setSimilarTrips] = useState([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const similarTripsCheckTimer = useRef(null);
  const [currentRegistration, setCurrentRegistration] = useState({
    departure_location: 'MBS Office',
    vehicle_id: '',
    requester_id: user?.id || '',
    registration_date: formatDateForInput(new Date()),
    departure_time: '', 
    destination: '', 
    participants: '', 
    notes: '',
    department_ids: [],
    attachment_path: null
  });

  const canViewRegistrations = user?.role === 'admin' || user?.permissions?.includes('VIEW_VEHICLE_REGISTRATIONS');
  const canViewWeekly = user?.role === 'admin' || user?.permissions?.includes('VIEW_VEHICLE_WEEKLY');
  const canCreateRegistration = user?.role === 'admin' || user?.permissions?.includes('CREATE_VEHICLE_REGISTRATION');
  const canEditRegistration = user?.role === 'admin' || user?.permissions?.includes('EDIT_VEHICLE_REGISTRATION');
  const canDeleteRegistration = user?.role === 'admin' || user?.permissions?.includes('DELETE_VEHICLE_REGISTRATION');
  const canCoordinate = user?.role === 'admin' || user?.permissions?.includes('COORDINATE_VEHICLE');
  const canApprove = user?.role === 'admin' || user?.permissions?.includes('APPROVE_VEHICLE_REGISTRATION');

  const statusLabels = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', scheduled: 'Đã lên lịch', pending_change: 'Chờ duyệt thay đổi', cancelled: 'Đã hủy' };
  const statusColors = { pending: '#f0ad4e', approved: '#5bc0de', rejected: '#d9534f', scheduled: '#5cb85c', pending_change: '#f0ad4e', cancelled: '#999' };

  // Modal gán xe (chỉ điều phối viên, chỉ khi phiếu đã được duyệt)
  const [assignModal, setAssignModal] = useState({ show: false, registration: null, vehicleId: '' });

  const hasActions = canEditRegistration || canDeleteRegistration || canApprove || canCoordinate || canCreateRegistration;

  useEffect(() => {
    if (!canViewRegistrations && !canViewWeekly) {
      setLoading(false);
      return;
    }

    // Nếu mặc định là list nhưng không có quyền xem list mà có quyền xem tuần, tự chuyển sang tuần
    if (viewMode === 'list' && !canViewRegistrations && canViewWeekly) {
      setViewMode('week');
      return; // Sẽ trigger useEffect lại với viewMode mới
    }

    fetchVehicles(); // Tải danh sách xe cho cả người đăng ký và điều phối

    if (viewMode === 'list' && canViewRegistrations) {
      fetchRegistrations();
    } else if (viewMode === 'week' && canViewWeekly) {
      fetchWeekRegistrations();
    }
    
    fetchUsers();
    fetchDepartments();
  }, [canViewRegistrations, canViewWeekly, viewMode, pagination.page, pagination.limit]);

  useEffect(() => {
  }, [canViewRegistrations, canViewWeekly, viewMode, currentWeekStart]);

  // Hàm toggle đóng/mở menu
  const toggleDropdown = (id) => {
    setActiveDropdownId(prev => prev === id ? null : id);
  };
  // Hàm xử lý xem chi tiết yêu cầu thay đổi (chỉ điều phối viên)
  const handlePreviewChange = async (reg) => {
    try {
      // Gọi API lấy chi tiết change (đảm bảo đã định nghĩa hàm getChangeDetails trong vehicleRegistrationsAPI)
      const res = await vehicleRegistrationsAPI.getChangeDetails(reg.id, reg.pending_change_id);
      
      // Mở modal với dữ liệu so sánh
      setChangePreviewModal({
        show: true,
        original: reg,
        requested: res.data.requested_data
      });
    } catch (err) {
      console.error('Error fetching change details:', err);
      alert('Không thể tải thông tin thay đổi.');
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesAPI.getAll(); // Gọi từ vehiclesAPI
      const data = response.data.data || response.data;
      setVehiclesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };
  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getAllSimple(); // Gọi từ departmentsAPI
      const data = response.data.data || response.data;
      setDepartmentsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };


const fetchRegistrations = async () => {
    setLoading(true);
      try {
        const params = { page: pagination.page, limit: pagination.limit };
        const response = await vehicleRegistrationsAPI.getAll(params);
        setRegistrations(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data?.pagination?.total ?? prev.total,
          totalPages: response.data?.pagination?.totalPages ?? prev.totalPages
        }));
      } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách đăng ký xe.');
      console.error('Error fetching vehicle registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  };

  const fetchWeekRegistrations = async () => {
    setLoading(true);
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Sunday

    try {
      const params = {
        startDate: formatDateForInput(start),
        endDate: formatDateForInput(end),
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

  const handleAddClick = () => {
    setIsEditing(false);
    setAttachedFile(null);
    setSimilarTrips([]);
    setShowMergeModal(false);
    setCurrentRegistration({
      departure_location: 'MBS Office',
      vehicle_id: '',
      requester_id: user?.id || '',
      registration_date: formatDateForInput(new Date()),
      departure_time: '', 
      destination: '', 
      participants: '', 
      notes: '',
      department_ids: []
    });
    setShowModal(true);
  };

  const handleEditClick = (registration) => {
    setIsEditing(true);
    setAttachedFile(null);
    setSimilarTrips([]);
    setShowMergeModal(false);
    setCurrentRegistration({
      ...registration,
      registration_date: formatDateForInput(registration.registration_date),
      departure_location: registration.departure_location || 'MBS Office',
      departure_time: registration.departure_time || '',
      destination: registration.destination || '',
      participants: registration.participants || '',
      department_ids: registration.department_ids || []
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đăng ký xe này?')) return;
    try {
      await vehicleRegistrationsAPI.delete(id);
      alert('Xóa đăng ký xe thành công!');
      fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa đăng ký xe.');
      console.error('Error deleting vehicle registration:', err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (attachedFile) {
        // Có file đính kèm -> PHẢI dùng fetch thuần + FormData.
        // Lý do: apiClient (axios) đang cấu hình cứng header 'Content-Type: application/json'
        // ở mức instance, khiến FormData bị gửi sai định dạng và multer ở backend
        // sẽ không nhận được file (req.file luôn undefined). Đây chính là nguyên nhân
        // "upload file trong phiếu đăng ký" trước đây không hoạt động.
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        const formData = new FormData();
        Object.entries(currentRegistration).forEach(([key, value]) => {
          if (value === null || value === undefined || key === '_isChangeRequest' || key === 'attachment_path') return;
          if (key === 'department_ids') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        });
        formData.append('file', attachedFile);

        let url, method;
        if (currentRegistration._isChangeRequest) {
          url = `${baseUrl}/vehicle-registrations/${currentRegistration.id}/request-change`;
          method = 'POST';
        } else if (isEditing) {
          url = `${baseUrl}/vehicle-registrations/${currentRegistration.id}`;
          method = 'PUT';
        } else {
          url = `${baseUrl}/vehicle-registrations`;
          method = 'POST';
        }

        const response = await fetch(url, {
          method,
          credentials: 'include', // Gửi HTTP-only cookie xác thực, giống các trang khác trong hệ thống
          body: formData
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || 'Lỗi khi upload file đính kèm');
        }
        alert(currentRegistration._isChangeRequest
          ? 'Đã gửi yêu cầu thay đổi. Chờ điều phối viên phê duyệt!'
          : (isEditing ? 'Cập nhật đăng ký xe thành công!' : 'Thêm đăng ký xe thành công!'));
      } else if (currentRegistration._isChangeRequest) {
        await vehicleRegistrationsAPI.requestChange(currentRegistration.id, currentRegistration);
        alert('Đã gửi yêu cầu thay đổi. Chờ điều phối viên phê duyệt!');
      } else if (isEditing) {
        await vehicleRegistrationsAPI.update(currentRegistration.id, currentRegistration);
        alert('Cập nhật đăng ký xe thành công!');
      } else {
        await vehicleRegistrationsAPI.create(currentRegistration);
        alert('Thêm đăng ký xe thành công!');
      }
      setShowModal(false);
      setAttachedFile(null);
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi lưu đăng ký xe.');
      console.error('Error saving vehicle registration:', err);
    }
  };
  // Hàm xử lý ghép chuyến đi
  const handleMergeTrip = async (targetId, newId) => {
   try {
     await vehicleRegistrationsAPI.merge(targetId, newId);
     alert('Đã ghép chuyến thành công!');
     refreshData(); // Cập nhật lại danh sách sau khi ghép
   } catch (err) {
     alert(err.response?.data?.message || 'Lỗi khi ghép chuyến.');
   }
 };

  // Hàm kiểm tra xem có chuyến đi tương tự đã tồn tại hay không (dựa trên ngày và điểm đến)
  const checkSimilarTrips = async (date, destination, excludeId) => {
    try {
      const res = await vehicleRegistrationsAPI.findSimilar(date, destination, excludeId);
       if (res.data.length > 0) {
         // Hiển thị Modal gợi ý ghép chuyến
         setSimilarTrips(res.data);
         setShowMergeModal(true);
       } else {
         setSimilarTrips([]);
         setShowMergeModal(false);
        }
       } catch (err) { console.error(err); }
    };

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setCurrentRegistration(prev => ({ ...prev, [name]: value }));
  // };

  // Hàm xử lý thay đổi input và kiểm tra chuyến đi tương tự (có debounce để tránh gọi API liên tục khi gõ)
  const handleChange = (e) => {
    const { name, value } = e.target;
      setCurrentRegistration(prev => {
         const next = { ...prev, [name]: value };

         // Kiểm tra sau khi cập nhật state
         if (name === 'registration_date' || name === 'destination') {
             const date = name === 'registration_date' ? value : next.registration_date;
             const dest = name === 'destination' ? value : next.destination;
             if (date && dest) {
                 if (similarTripsCheckTimer.current) clearTimeout(similarTripsCheckTimer.current);
                 similarTripsCheckTimer.current = setTimeout(() => {
                   checkSimilarTrips(date, dest, isEditing ? next.id : undefined);
                 }, 500);
             } else {
                 setShowMergeModal(false);
             }
         }
         return next;
     });
   };

  const handleDeptToggle = (deptId) => {
    setCurrentRegistration(prev => {
      const currentDepts = prev.department_ids || [];
      if (currentDepts.includes(deptId)) {
        return { 
          ...prev, 
          department_ids: currentDepts.filter(id => id !== deptId) 
        };
      } else {
        return { ...prev, department_ids: [...currentDepts, deptId] };
      }
    });
  };

  const refreshData = () => {
    if (viewMode === 'list') fetchRegistrations();
    else if (viewMode === 'week') fetchWeekRegistrations();
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Xác nhận duyệt phiếu đăng ký xe này?')) return;
    try {
      await vehicleRegistrationsAPI.approve(id);
      alert('Đã duyệt phiếu thành công!');
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi duyệt phiếu.');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Nhập lý do từ chối (không bắt buộc):', '');
    if (reason === null) return; // người dùng bấm Hủy
    try {
      await vehicleRegistrationsAPI.reject(id, reason);
      alert('Đã từ chối phiếu.');
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi từ chối phiếu.');
    }
  };

  // Hủy chuyến — dùng cho cả phiếu đã lên lịch (đã gán xe), khác với "Từ chối" chỉ áp dụng khi đang chờ duyệt
  const handleCancel = async (id) => {
    const reason = window.prompt('Nhập lý do hủy chuyến (không bắt buộc):', '');
    if (reason === null) return; // người dùng bấm Hủy trên hộp thoại
    if (!window.confirm('Xác nhận hủy chuyến đi này? Hành động này không thể hoàn tác.')) return;
    try {
      await vehicleRegistrationsAPI.cancel(id, reason);
      alert('Đã hủy chuyến đi thành công.');
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi hủy chuyến đi.');
    }
  };

  const openAssignModal = (registration) => {
    setAssignModal({ show: true, registration, vehicleId: registration.vehicle_id || '' });
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModal.vehicleId) { alert('Vui lòng chọn xe.'); return; }
    try {
      await vehicleRegistrationsAPI.assign(assignModal.registration.id, assignModal.vehicleId);
      alert('Đã gán xe và lên lịch thành công!');
      setAssignModal({ show: false, registration: null, vehicleId: '' });
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gán xe.');
    }
  };

  // Người tạo phiếu gửi yêu cầu thay đổi khi phiếu đã được duyệt/lên lịch:
  // mở lại modal Sửa nhưng khi submit sẽ gọi API request-change thay vì update trực tiếp
  const handleRequestChangeClick = (registration) => {
    setIsEditing(true);
    setCurrentRegistration({
      ...registration,
      registration_date: formatDateForInput(registration.registration_date),
      departure_location: registration.departure_location || 'MBS Office',
      departure_time: registration.departure_time || '',
      destination: registration.destination || '',
      participants: registration.participants || '',
      department_ids: registration.department_ids || [],
      _isChangeRequest: true
    });
    setShowModal(true);
  };

  const handleApproveChange = async (registration) => {
    if (!registration.pending_change_id) return;
    if (!window.confirm('Xác nhận duyệt yêu cầu thay đổi này?')) return;
    try {
      await vehicleRegistrationsAPI.approveChange(registration.id, registration.pending_change_id);
      alert('Đã duyệt yêu cầu thay đổi!');
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi duyệt yêu cầu thay đổi.');
    }
  };
  
  const handleRejectChange = async (registration) => {
    if (!registration.pending_change_id) return;
    if (!window.confirm('Xác nhận từ chối yêu cầu thay đổi này?')) return;
    try {
      await vehicleRegistrationsAPI.rejectChange(registration.id, registration.pending_change_id);
      alert('Đã từ chối yêu cầu thay đổi.');
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi từ chối yêu cầu thay đổi.');
    }
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

  const handleExport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (user?.role !== 'admin' && !canCoordinate) {
        params.department_id = user?.department_id;
      }
      await vehicleRegistrationsAPI.exportRegistrations(params);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xuất báo cáo.');
      console.error('Error exporting vehicle registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!canViewRegistrations && !canViewWeekly) return <div className="error-message">Bạn không có quyền truy cập trang này.</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Quản lý Đăng ký xe</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            {viewMode === 'list' && (
              <button className="btn btn-primary" onClick={handleExport}>Xuất báo cáo</button>
            )}
            {canCreateRegistration && (
              <button className="btn btn-primary" onClick={handleAddClick}>+ Thêm Đăng ký xe</button>
            )}
          </div>
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
        <>
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Biển số</th>
                <th>Phòng</th>
                <th>Người đăng ký</th>
                <th>Điểm đi</th>
                <th>Thời gian đi</th>
                <th>Điểm đến</th>
                <th>Thành phần tham gia</th>
                <th>File đính kèm</th>
                <th>Nội dung công việc / Ghi chú</th>
                <th>Trạng thái</th>
                {hasActions && <th>Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={hasActions ? 10 : 9} style={{ textAlign: 'center' }}>Không có dữ liệu đăng ký.</td>
                </tr>
              ) : (
                registrations.map(reg => {
                  const isOwner = reg.requester_id === user?.id;
                  return (
                  <tr key={reg.id}>
                    <td>{reg.plate_number ? <strong>{reg.plate_number}</strong> : <em style={{color: '#999'}}>Chưa gán</em>} ({reg.brand || '-'})</td>
                    <td>{reg.department_names || '-'}</td>
                    <td>{reg.requester_name}</td>
                    <td>{reg.departure_location || '-'}</td>
                    <td>
                      {reg.registration_date ? new Date(reg.registration_date).toLocaleDateString('vi-VN') : '-'}<br/>
                      {reg.departure_time || '-'}
                      </td>
                    <td className="col-long-text">
                      {reg.destination || '-'}
                    </td>
                    <td className="col-long-text">
                      {reg.participants || '-'}
                    </td>
                    <td>
                      {reg.attachment_path ? <a href={`${import.meta.env.VITE_API_URL || '/api'}/download/${reg.attachment_path.split('/').pop()}`} target="_blank" rel="noopener noreferrer">Xem file</a> : '-'}
                    </td>
                    <td>{reg.notes || '-'}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
                        fontSize: '0.8em', color: '#fff', background: statusColors[reg.status] || '#999'
                      }}>
                        {statusLabels[reg.status] || reg.status}
                      </span>
                    </td>
                    {hasActions && (
                      // <td style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
                      //   {/* Buoc 2: Duyet / Tu choi phieu - chi khi dang cho duyet */}
                      //   {canApprove && reg.status === 'pending' && (
                      //     <>
                      //       <button className="btn btn-sm btn-info" onClick={() => handlePreviewChange(reg)}>Xem thay đổi</button>
                      //       <button className="btn btn-sm btn-primary" onClick={() => handleApprove(reg.id)}>Duyệt</button>
                      //       <button className="btn btn-sm btn-danger" onClick={() => handleReject(reg.id)}>Từ chối</button>
                      //     </>
                      //   )}
                      //   {/* Buoc 3: Gan xe - chi khi da duyet (hoac doi xe khi da len lich) */}
                      //   {canCoordinate && (reg.status === 'approved' || reg.status === 'scheduled') && (
                      //     <button className="btn btn-sm btn-outline" onClick={() => openAssignModal(reg)}>Gán xe</button>
                      //   )}
                      //   {/* Mo rong: gui yeu cau thay doi khi da duyet/len lich - chi chu phieu hoac dieu phoi vien */}
                      //   {(isOwner || canCoordinate) && ['approved', 'scheduled'].includes(reg.status) && (
                      //     <button className="btn btn-sm btn-outline" onClick={() => handleRequestChangeClick(reg)}>Yêu cầu đổi</button>
                      //   )}
                      //   {/* Mo rong: duyet/tu choi yeu cau thay doi - dieu phoi vien */}
                      //   {canCoordinate && reg.status === 'pending_change' && reg.pending_change_id && (
                      //     <>
                      //       <button className="btn btn-sm btn-outline" onClick={() => handlePreviewChange(reg)}>Xem thay đổi</button>
                      //       <button className="btn btn-sm btn-primary" onClick={() => handleApproveChange(reg)}>Duyệt đổi</button>
                      //       <button className="btn btn-sm btn-danger" onClick={() => handleRejectChange(reg)}>Từ chối đổi</button>
                      //     </>
                      //   )}
                      //   {canEditRegistration && reg.status === 'pending' && <button className="btn btn-sm btn-outline" onClick={() => handleEditClick(reg)}>Sửa</button>}
                      //   {(isOwner || canCoordinate) && ['pending', 'approved', 'scheduled', 'pending_change'].includes(reg.status) && (
                      //     <button className="btn btn-sm btn-danger" onClick={() => handleCancel(reg.id)}>Hủy chuyến</button>
                      //   )}
                      //   {canDeleteRegistration && <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(reg.id)}>Xóa</button>}
                      // </td>
                      
                        <td style={{ textAlign: 'center', position: 'relative', verticalAlign: 'middle' }}>
                          {/* Nút kích hoạt Dropdown */}
                          <button 
                            className="btn btn-sm btn-light" 
                            onClick={() => toggleDropdown(reg.id)}
                            style={{ padding: '4px 10px', fontSize: '16px', fontWeight: 'bold' }}
                          >
                            ⋮
                          </button>

                          {/* Menu hành động dạng Popover */}
                          {activeDropdownId === reg.id && (
                            <div style={{
                              position: 'absolute',
                              right: '10px',
                              top: '80%',
                              backgroundColor: '#fff',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              borderRadius: '6px',
                              padding: '6px 0',
                              zIndex: 1000,
                              minWidth: '150px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'stretch',
                              textAlign: 'left',
                            }}>
                              {/* Bước 2: Duyệt / Từ chối phiếu */}
                              {canApprove && reg.status === 'pending' && (
                                <>
                                  <button className="dropdown-item" onClick={() => { handlePreviewChange(reg); setActiveDropdownId(null); }}>Xem thay đổi</button>
                                  <button className="dropdown-item text-primary" onClick={() => { handleApprove(reg.id); setActiveDropdownId(null); }}>Duyệt đổi </button>
                                  <button className="dropdown-item text-danger" onClick={() => { handleReject(reg.id); setActiveDropdownId(null); }}>Từ chối</button>
                                </>
                              )}

                              {/* Bước 3: Gán xe */}
                              {canCoordinate && ['approved', 'scheduled'].includes(reg.status) && (
                                <button className="dropdown-item" onClick={() => { openAssignModal(reg); setActiveDropdownId(null); }}>Gán xe</button>
                              )}

                              {/* Yêu cầu đổi */}
                              {(isOwner || canCoordinate) && ['approved', 'scheduled'].includes(reg.status) && (
                                <button className="dropdown-item" onClick={() => { handleRequestChangeClick(reg); setActiveDropdownId(null); }}>Yêu cầu đổi</button>
                              )}

                              {/* Duyệt / Từ chối yêu cầu thay đổi */}
                              {canCoordinate && reg.status === 'pending_change' && reg.pending_change_id && (
                                <>
                                  <button className="dropdown-item" onClick={() => { handlePreviewChange(reg); setActiveDropdownId(null); }}>Xem thay đổi</button>
                                  <button className="dropdown-item text-primary" onClick={() => { handleApproveChange(reg); setActiveDropdownId(null); }}>Duyệt đổi</button>
                                  <button className="dropdown-item text-danger" onClick={() => { handleRejectChange(reg); setActiveDropdownId(null); }}>Từ chối đổi</button>
                                </>
                              )}

                              {/* Sửa */}
                              {canEditRegistration && reg.status === 'pending' && (
                                <button className="dropdown-item" onClick={() => { handleEditClick(reg); setActiveDropdownId(null); }}>Sửa</button>
                              )}

                              {/* Hủy chuyến */}
                              {(isOwner || canCoordinate) && ['pending', 'approved', 'scheduled', 'pending_change'].includes(reg.status) && (
                                <button className="dropdown-item text-warning" onClick={() => { handleCancel(reg.id); setActiveDropdownId(null); }}>Hủy chuyến</button>
                              )}

                              {/* Xóa */}
                              {canDeleteRegistration && (
                                <button className="dropdown-item text-danger" onClick={() => { handleDeleteClick(reg.id); setActiveDropdownId(null); }}>Xóa</button>
                              )}
                            </div>
                          )}
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

      {pagination.totalPages > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} bản ghi
          </div>
          <div className="pagination-controls">
            <select value={pagination.limit} onChange={(e) => handleLimitChange(e.target.value)} className="pagination-limit">
              <option value="10">10 / trang</option>
              <option value="20">20 / trang</option>
              <option value="50">50 / trang</option>
            </select>
            <div className="pagination-buttons">
              <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1} className="btn btn-sm">««</button>
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="btn btn-sm">«</button>
              <span className="pagination-page-info">Trang {pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="btn btn-sm">»</button>
              <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="btn btn-sm">»»</button>
            </div>
          </div>
        </div>
      )}
        </>
      ) : viewMode === 'week' ? (
        <div className="table-container" style={{ padding: '5px' }}>
          <div className="week-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', minWidth: '900px' }}>
          {getDaysOfWeek().map((day, idx) => {
            const dateStr = formatDateForInput(day);
            const dayRegistrations = registrations.filter(r => formatDateForInput(r.registration_date) === dateStr && r.status === 'scheduled');            
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
                      // onClick={() => handleEditClick(reg)}
                      style={{ 
                        fontSize: '0.85em', 
                        padding: '4px 8px', 
                        marginBottom: '4px', 
                        background: 'var(--color-bg-light)', 
                        borderRadius: '4px',
                        // cursor: 'pointer',
                        borderLeft: '3px solid var(--color-primary)'
                      }}
                      title={`${reg.plate_number || 'Chưa gán xe'} - ${reg.requester_name}`}
                    >
                      <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {reg.departure_time || '??:??'} - {reg.plate_number || 'Chờ gán'}
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>Địa điểm: {reg.destination}</div>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>Phòng: {reg.department_names}</div>
                      {/* <div style={{ fontSize: '0.8em', color: '#666' }}>Thành phần tham gia: {reg.participants}</div> */}
                      <div style={{ fontSize: '0.8em', color: '#666' }}>Số lượng: {countParticipants(reg.participants)} người</div>                  
                    </div> // TODO: Cập nhật hiển thị này để dùng plate_number/brand
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
    {changePreviewModal.show && (
      <div className="modal-overlay">
        <div className="modal" style={{ width: '700px' }}>
          <div className="modal-header">
            <h2>So sánh thay đổi</h2>
            <button onClick={() => setChangePreviewModal({ show: false, original: null, requested: null })} className="btn btn-sm btn-outline">&times;</button>
          </div>
          <div className="modal-body">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Trường</th>
                  <th style={{ padding: '8px' }}>Giá trị cũ</th>
                  <th style={{ padding: '8px' }}>Giá trị mới</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px' }}>Ngày đi</td>
                  <td style={{ padding: '8px' }}>{formatDateForDisplay(changePreviewModal.original.registration_date)}</td>
                  <td style={{ padding: '8px', color: 'blue' }}>{formatDateForDisplay(changePreviewModal.requested.registration_date)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>Thời gian</td>
                  <td style={{ padding: '8px' }}>{changePreviewModal.original.departure_time}</td>
                  <td style={{ padding: '8px', color: 'blue' }}>{changePreviewModal.requested.departure_time}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>Điểm đi</td>
                  <td style={{ padding: '8px' }}>{changePreviewModal.original.departure_location}</td>
                  <td style={{ padding: '8px', color: 'blue' }}>{changePreviewModal.requested.departure_location}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>Điểm đến</td>
                  <td style={{ padding: '8px' }}>{changePreviewModal.original.destination}</td>
                  <td style={{ padding: '8px', color: 'blue' }}>{changePreviewModal.requested.destination}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>Thành phần</td>
                  <td style={{ padding: '8px' }}>{changePreviewModal.original.participants}</td>
                  <td style={{ padding: '8px', color: 'blue' }}>{changePreviewModal.requested.participants}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>Ghi chú</td>
                  <td style={{ padding: '8px' }}>{changePreviewModal.original.notes}</td>
                  <td style={{ padding: '8px', color: 'blue' }}>{changePreviewModal.requested.notes}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <button onClick={() => setChangePreviewModal({ show: false, original: null, requested: null })} className="btn btn-outline">Đóng</button>
          </div>
        </div>
      </div>
    )}

    {/* Lưu ý: modal gợi ý ghép chuyến hiển thị NGAY BÊN TRONG form tạo/sửa phiếu bên dưới
        (trong khối showModal), không dùng modal đứng riêng ở đây để tránh chồng 2 lớp modal
        cùng lúc khi state showMergeModal bật lên trong lúc form tạo phiếu đang mở. */}

    {showModal && ( // Modal Thêm/Sửa Đăng ký xe
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {currentRegistration._isChangeRequest
                  ? 'Gửi yêu cầu thay đổi Đăng ký xe'
                  : (isEditing ? 'Cập nhật Yêu cầu Đăng ký xe' : 'Tạo Yêu cầu Đăng ký xe mới')}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-outline">&times;</button>
            </div>
            {/* Lưu ý: người tạo/sửa phiếu KHÔNG được chọn xe ở bước này.
                Việc gán xe do điều phối viên thực hiện sau khi phiếu đã được duyệt. */}
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {showMergeModal && (
                  <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '5px', marginBottom: '15px', border: '1px solid #ffeeba' }}>
                    <p><strong>💡 Gợi ý:</strong> Tìm thấy các chuyến cùng ngày và địa điểm:</p>
                    {similarTrips.map(trip => (
                      <div key={trip.id} style={{ marginBottom: '10px', padding: '10px', background: '#fff', borderRadius: '4px', border: '1px solid #ddd' }}>
                        <p>Xe: {trip.plate_number} | Giờ: {trip.departure_time}</p>
                        <button type="button" className="btn btn-sm btn-primary" onClick={async () => {
                          try {
                            await vehicleRegistrationsAPI.addDepartmentToTrip(trip.id, user.department_id);
                            alert('Đã ghép vào chuyến thành công!');
                            setShowMergeModal(false);
                            setShowModal(false);
                            refreshData();
                          } catch (err) {
                            alert('Lỗi khi ghép chuyến.');
                          }
                        }}>Ghép chuyến này</button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowMergeModal(false)}>Tiếp tục tạo mới</button>
                  </div>
                )}
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

                    {/* Tags các phòng đã chọn */}
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
                  <input type="date" name="registration_date" value={currentRegistration.registration_date} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Thời gian khởi hành *</label>
                  <input type="time" name="departure_time" value={currentRegistration.departure_time} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Địa điểm đến *</label>
                  <input type="text" name="destination" value={currentRegistration.destination} onChange={handleChange} required />
                </div>
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
                  <input 
                    type="file" 
                    onChange={(e) => setAttachedFile(e.target.files[0])} 
                  />
                  {attachedFile && (
                    <div style={{ marginTop: '5px' }}>
                      ✓ Đã chọn: <strong>{attachedFile.name}</strong>
                    </div>
                  )}
                  {currentRegistration.attachment_path && !attachedFile && (
                    <div style={{ marginTop: '5px' }}>
                      <a 
                        href={`${import.meta.env.VITE_API_URL || '/api'}/download/${currentRegistration.attachment_path.split('/').pop()}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Xem file hiện tại
                      </a>
                    </div>
                  )}
                </div>
                {/* Thêm các trường khác nếu cần, ví dụ asset_id, owner_id (dropdown chọn từ danh sách assets/users) */}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
    )}

      {assignModal.show && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Gán xe cho phiếu {assignModal.registration?.registration_number}</h2>
              <button onClick={() => setAssignModal({ show: false, registration: null, vehicleId: '' })} className="btn btn-sm btn-outline">&times;</button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div className="modal-body">
                <p>Điểm đến: <strong>{assignModal.registration?.destination}</strong></p>
                <p>Ngày/giờ đi: <strong>{formatDateForInput(assignModal.registration?.registration_date)} {assignModal.registration?.departure_time}</strong></p>
                <div className="form-group">
                  <label>Chọn xe *</label>
                  <select
                    value={assignModal.vehicleId}
                    onChange={(e) => setAssignModal(prev => ({ ...prev, vehicleId: e.target.value }))}
                    required
                  >
                    <option value="">-- Chọn xe --</option>
                    {vehiclesList.map(v => (
                      <option key={v.id} value={v.id}>{v.plate_number} - {v.brand} {v.model}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setAssignModal({ show: false, registration: null, vehicleId: '' })} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Gán xe</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VehicleRegistrationPage;