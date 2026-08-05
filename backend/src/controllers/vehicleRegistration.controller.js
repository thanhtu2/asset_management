import * as XLSX from 'xlsx';
import VehicleRegistration from '../models/VehicleRegistration.js';

export const createVehicleRegistration = async (req, res) => {
  try {
    const { registration_date, destination, departure_location } = req.body;
    if (!registration_date || !destination || !departure_location) {
      return res.status(400).json({ message: 'Ngày khởi hành, điểm đi và điểm đến là bắt buộc.' });
    }
    // requester_id tự động lấy từ token người dùng
    const newRegistrationId = await VehicleRegistration.create({ ...req.body, requester_id: req.user.id }, req.user.id);
    res.status(201).json({ message: 'Thêm đăng ký xe thành công', id: newRegistrationId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Số đăng ký xe này đã tồn tại.' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getAllVehicleRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, vehicle_id, requester_id } = req.query;
    
    // Lưu ý: Trong Model VehicleRegistration.js, hàm findAll cần sửa SQL để JOIN với bảng vehicles
    // Ví dụ SQL: SELECT vr.*, v.plate_number, v.brand, u.fullName as requester_name 
    //            FROM vehicle_registrations vr 
    //            LEFT JOIN vehicles v ON vr.vehicle_id = v.id
    //            LEFT JOIN users u ON vr.requester_id = u.id

    const filters = { search, vehicle_id, requester_id, department_id: req.query.department_id };
    const { data, pagination } = await VehicleRegistration.findAll(filters, parseInt(page), parseInt(limit));
    res.json({ data, pagination });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVehicleRegistrationById = async (req, res) => {
  try {
    const registration = await VehicleRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });
    }
    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVehicleRegistration = async (req, res) => {
  try {
    const { registration_date, destination, departure_location } = req.body;
    if (!registration_date || !destination || !departure_location) {
      return res.status(400).json({ message: 'Ngày khởi hành, điểm đi và điểm đến là bắt buộc.' });
    }
    const affectedRows = await VehicleRegistration.update(req.params.id, { ...req.body, requester_id: req.user.id }, req.user.id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe để cập nhật.' });
    }
    res.json({ message: 'Cập nhật đăng ký xe thành công.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Số đăng ký xe này đã tồn tại.' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteVehicleRegistration = async (req, res) => {
  try {
    const affectedRows = await VehicleRegistration.delete(req.params.id, req.user.id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe để xóa.' });
    }
    res.json({ message: 'Xóa đăng ký xe thành công.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportVehicleRegistrations = async (req, res) => {
  try {
    const { search, vehicle_id, requester_id } = req.query;
    let department_id = req.query.department_id;

    // Nếu không phải Admin hoặc Điều phối viên (có quyền COORDINATE_VEHICLE), chỉ xuất dữ liệu phòng của mình
    const canCoordinate = req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('COORDINATE_VEHICLE'));
    if (!canCoordinate) {
      department_id = req.user.department_id;
    }

    const filters = {
      search,
      vehicle_id,
      requester_id,
      department_id,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Lấy tất cả bản ghi khớp với điều kiện lọc (không chia trang)
    const { data } = await VehicleRegistration.findAll(filters, 1, 1000000);

    const statusLabels = {
      'pending': 'Chờ duyệt',
      'approved': 'Đã duyệt',
      'rejected': 'Từ chối',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã hủy'
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const countParticipants = (participants) => {
      if (!participants || participants.trim() === '') return 0;
      return participants.split(',').filter(p => p.trim() !== '').length;
    };

    const mappedData = data.map(reg => ({
      'Số đăng ký': reg.registration_number,
      'Biển số xe': reg.plate_number || 'Chưa gán',
      'Nhãn hiệu/Tên xe': reg.brand ? `${reg.brand} ${reg.model || ''}`.trim() : 'Chưa gán',
      'Phòng ban tham gia': reg.department_names || '',
      'Người đăng ký': reg.requester_name || '',
      'Ngày khởi hành': formatDate(reg.registration_date),
      'Thời gian khởi hành': reg.departure_time || '',
      'Điểm đi': reg.departure_location || '',
      'Địa điểm đến': reg.destination || '',
      'Thành phần tham gia': reg.participants || '',
      'Số lượng tham gia': countParticipants(reg.participants),
      'Trạng thái': statusLabels[reg.status] || 'Chờ duyệt',
      'Ghi chú': reg.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(mappedData);
    ws['!cols'] = [
      { wch: 15 }, // Số đăng ký
      { wch: 15 }, // Biển số xe
      { wch: 20 }, // Nhãn hiệu/Tên xe
      { wch: 25 }, // Phòng ban tham gia
      { wch: 20 }, // Người đăng ký
      { wch: 15 }, // Ngày khởi hành
      { wch: 18 }, // Thời gian khởi hành
      { wch: 20 }, // Điểm đi
      { wch: 25 }, // Địa điểm đến
      { wch: 30 }, // Thành phần tham gia
      { wch: 18 }, // Số lượng tham gia
      { wch: 15 }, // Trạng thái
      { wch: 30 }  // Ghi chú
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Đăng ký xe');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="danh_sach_dang_ky_xe.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('exportVehicleRegistrations error:', error);
    res.status(500).json({ message: error.message });
  }
};