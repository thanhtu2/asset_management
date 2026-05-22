/**
 * VehicleRegistrationPage
 * 
 * Quản lý việc đăng ký và xem lịch trình sử dụng xe.
 * - Chế độ 'list': Yêu cầu quyền VIEW_VEHICLE_REGISTRATIONS.
 * - Chế độ 'week': Yêu cầu quyền VIEW_VEHICLE_WEEKLY.
 * - Tự động lọc dữ liệu theo phòng ban nếu không có quyền COORDINATE_VEHICLE.
 * - Hiển thị dữ liệu đăng ký trực tiếp lên lưới lịch 7 ngày.
 */
import { useState, useEffect } from 'react';
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
  // State cho modal đăng ký xe
  const [isEditing, setIsEditing] = useState(false);
  const [currentRegistration, setCurrentRegistration] = useState({
    departure_location: 'MBS Office',
    vehicle_id: '',
    requester_id: user?.id || '',
    registration_date: formatDateForInput(new Date()),
    departure_time: '', 
    destination: '', 
    participants: '', 
    notes: '',
    department_ids: [] // Chuyển sang mảng
  });

  const canViewRegistrations = user?.role === 'admin' || user?.permissions?.includes('VIEW_VEHICLE_REGISTRATIONS');
  const canViewWeekly = user?.role === 'admin' || user?.permissions?.includes('VIEW_VEHICLE_WEEKLY');
  const canCreateRegistration = user?.role === 'admin' || user?.permissions?.includes('CREATE_VEHICLE_REGISTRATION');
  const canEditRegistration = user?.role === 'admin' || user?.permissions?.includes('EDIT_VEHICLE_REGISTRATION');
  const canDeleteRegistration = user?.role === 'admin' || user?.permissions?.includes('DELETE_VEHICLE_REGISTRATION');
  const canCoordinate = user?.role === 'admin' || user?.permissions?.includes('COORDINATE_VEHICLE');

  const hasActions = canEditRegistration || canDeleteRegistration;

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
  }, [canViewRegistrations, canViewWeekly, viewMode]);

  useEffect(() => {
  }, [canViewRegistrations, canViewWeekly, viewMode, currentWeekStart]);

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
      const params = {};
      // Nếu không phải Admin hoặc Điều phối viên, chỉ lấy dữ liệu của phòng mình
      if (user?.role !== 'admin' && !canCoordinate) {
        params.department_id = user?.department_id;
      }
      
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
      const params = {
        startDate: formatDateForInput(start),
        endDate: formatDateForInput(end),
        limit: 100
      };

      if (user?.role !== 'admin' && !canCoordinate) {
        params.department_id = user?.department_id;
      }

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
      const res = await usersAPI.getAll();
      setUsersList(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAddClick = () => {
    setIsEditing(false);
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
      if (isEditing) {
        await vehicleRegistrationsAPI.update(currentRegistration.id, currentRegistration);
        alert('Cập nhật đăng ký xe thành công!');
      } else {
        await vehicleRegistrationsAPI.create(currentRegistration);
        alert('Thêm đăng ký xe thành công!');
      }
      setShowModal(false);
      // Tải lại dữ liệu tương ứng với chế độ xem hiện tại
      if (viewMode === 'list') fetchRegistrations();
      else if (viewMode === 'week') fetchWeekRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi lưu đăng ký xe.');
      console.error('Error saving vehicle registration:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentRegistration(prev => ({ ...prev, [name]: value }));
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
                <th>Điểm đi</th>
                <th>Thời gian xuất phát</th>
                <th>Địa điểm đến</th>
                <th>Thành phần tham gia</th>
                <th>Ghi chú</th>
                {hasActions && <th>Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={hasActions ? 8 : 7} style={{ textAlign: 'center' }}>Không có dữ liệu đăng ký.</td>
                </tr>
              ) : (
                registrations.map(reg => (
                  <tr key={reg.id}>
                    <td>{reg.plate_number ? <strong>{reg.plate_number}</strong> : <em style={{color: '#999'}}>Chưa gán</em>} ({reg.brand || '-'})</td>
                    <td>{reg.department_names || '-'}</td>
                    <td>{reg.requester_name}</td>
                    <td>{reg.departure_location || '-'}</td>
                    <td>{reg.departure_time || '-'}</td>
                    <td>{reg.destination || '-'}</td>
                    <td>{reg.participants || '-'}</td>
                    <td>{reg.notes || '-'}</td>
                    {hasActions && (
                      <td>
                        {canEditRegistration && <button className="btn btn-sm btn-outline" onClick={() => handleEditClick(reg)}>Sửa</button>}
                        {canDeleteRegistration && <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(reg.id)}>Xóa</button>}
                      </td>
                    )}
                  </tr>
                ))
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
                      <div style={{ fontSize: '0.8em', color: '#666' }}>Địa điểm: {reg.destination}</div>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>Phòng: {reg.department_names}</div>
                      {/* <div style={{ fontSize: '0.8em', color: '#666' }}>Thành phần tham gia: {reg.participants}</div> */}
                      <div style={{ fontSize: '0.8em', color: '#666' }}>Số lượng: {countParticipants(reg.participants)} người</div>                  
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
                  <label>Chọn xe có sẵn *</label>
                  <select name="vehicle_id" value={currentRegistration.vehicle_id} onChange={handleChange}>
                    <option value="">-- Chọn xe --</option>
                    {vehiclesList.map(v => (
                      <option key={v.id} value={v.id}>{v.plate_number} - {v.brand} {v.model}</option>
                    ))}
                  </select>
                  {vehiclesList.length === 0 && (
                    <small style={{ color: 'red' }}>⚠️ Không tìm thấy xe nào trong hệ thống. Vui lòng kiểm tra lại bảng vehicles.</small>
                  )}
                </div>
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
                  <label>Ngày khởi hành *</label>
                  <input type="date" name="registration_date" value={currentRegistration.registration_date} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Thời gian khởi hành *</label>
                  <input type="time" name="departure_time" value={currentRegistration.departure_time} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Địa điểm đến *</label>
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

    </div>
  );
};

export default VehicleRegistrationPage;