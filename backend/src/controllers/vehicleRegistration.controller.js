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
//
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