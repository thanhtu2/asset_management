import VehicleRegistration from '../models/VehicleRegistration.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createNotification } from '../notification.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Các quyền coi là "có thể xem toàn công ty" thay vì chỉ phòng ban của mình
const hasCompanyWideView = (req) =>
  req.user?.role === 'admin' ||
  req.user?.permissions?.includes('COORDINATE_VEHICLE') ||
  req.user?.permissions?.includes('APPROVE_VEHICLE_REGISTRATION');

export const createVehicleRegistration = async (req, res) => {
  try {
    const { registration_date, destination, departure_location, department_ids } = req.body;
    if (!registration_date || !destination || !departure_location) {
      return res.status(400).json({ message: 'Ngày khởi hành, điểm đi và điểm đến là bắt buộc.' });
    }
    if (!Array.isArray(department_ids) || department_ids.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một phòng ban tham gia.' });
    }
    // Lưu ý: vehicle_id KHÔNG được nhận từ client ở bước tạo phiếu — người tạo chỉ gửi
    // thông tin yêu cầu; lãnh đạo duyệt trước, điều phối viên mới gán xe cụ thể sau.
    const newRegistrationId = await VehicleRegistration.create({ ...req.body, requester_id: req.user.id }, req.user.id);
    res.status(201).json({ message: 'Gửi yêu cầu đăng ký xe thành công. Đang chờ lãnh đạo duyệt.', id: newRegistrationId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Số đăng ký xe này đã tồn tại.' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getAllVehicleRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, vehicle_id, requester_id, status } = req.query;

    // Cho phép tất cả người dùng đã xác thực xem danh sách, bỏ lọc chặt chẽ theo phòng ban
    // trừ khi có tham số department_id được truyền lên từ query (chỉ admin mới có quyền lọc phòng ban khác).
    let departmentId = req.query.department_id;
    if (!hasCompanyWideView(req)) {
       // Nếu người dùng không có quyền xem toàn công ty, ta vẫn có thể gợi ý lọc theo phòng ban của họ
       // nhưng không ép buộc nếu họ muốn xem tất cả.
       // Để thực sự mở: không ép departmentId = req.user?.department_id;
    }

    const filters = { search, vehicle_id, requester_id, status, department_id: departmentId };
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
    if (!hasCompanyWideView(req)) {
      const belongsToMyDept = (registration.department_ids || []).includes(req.user?.department_id);
      const isOwner = registration.requester_id === req.user?.id;
      if (!belongsToMyDept && !isOwner) {
        return res.status(403).json({ message: 'Bạn không có quyền xem đăng ký xe của phòng ban khác.' });
      }
    }
    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVehicleRegistration = async (req, res) => {
  try {
    const existing = await VehicleRegistration.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe để cập nhật.' });
    }
    // Chỉ cho sửa nội dung khi phiếu đang 'pending' (chưa duyệt) hoặc 'rejected'
    // (bị trả về). Sau khi lãnh đạo đã duyệt ('approved'/'scheduled'), không được sửa
    // trực tiếp — phải để người có quyền từ chối trả về trước.
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && !['pending', 'rejected'].includes(existing.status)) {
      return res.status(400).json({ message: 'Phiếu đã được lãnh đạo duyệt, không thể sửa. Vui lòng liên hệ người duyệt để từ chối (trả về) trước khi sửa lại.' });
    }

    const { registration_date, destination, departure_location } = req.body;
    if (!registration_date || !destination || !departure_location) {
      return res.status(400).json({ message: 'Ngày khởi hành, điểm đi và điểm đến là bắt buộc.' });
    }

    // Không cho phép chỉnh vehicle_id/status qua API sửa nội dung thông thường —
    // chỉ đổi qua các endpoint chuyên biệt (approve / assign-vehicle / reject).
    const { vehicle_id, status, ...safeData } = req.body;

    const result = await VehicleRegistration.update(req.params.id, { ...safeData, requester_id: existing.requester_id }, req.user.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe để cập nhật.' });
    }
    res.json({
      message: result.resubmitted
        ? 'Đã cập nhật và nộp lại phiếu. Đang chờ lãnh đạo duyệt lại.'
        : 'Cập nhật đăng ký xe thành công.'
    });
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

// --- Luồng xử lý phiếu: pending -> approved (lãnh đạo) -> scheduled (điều phối) ---

/**
 * Bước 2 — Người có quyền APPROVE_VEHICLE_REGISTRATION (lãnh đạo) duyệt phiếu đang 'pending'.
 */
export const approveVehicleRegistration = async (req, res) => {
  try {
    const result = await VehicleRegistration.approve(req.params.id, req.user.id);
    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });
    }
    if (result.error === 'INVALID_STATUS') {
      return res.status(400).json({ message: `Phiếu đang ở trạng thái '${result.currentStatus}', không thể duyệt.` });
    }
    res.json({ message: 'Duyệt yêu cầu thành công. Đang chờ điều phối gán xe.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Bước 3 — Người có quyền COORDINATE_VEHICLE chọn xe cho phiếu đã 'approved'.
 * Sau bước này phiếu chuyển 'scheduled' và hiển thị trong Lịch tuần.
 */
export const assignVehicle = async (req, res) => {
  try {
    // Lấy ID xe, chấp nhận cả vehicle_id (snake_case) hoặc vehicleId (camelCase)
    const vehicle_id = req.body.vehicle_id || req.body.vehicleId;
    
    if (!vehicle_id) {
      return res.status(400).json({ message: 'Vui lòng chọn xe để gán cho phiếu đăng ký.' });
    }

    const result = await VehicleRegistration.assignVehicle(req.params.id, vehicle_id, req.user.id);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });
    }
    if (result.error === 'INVALID_STATUS') {
      return res.status(400).json({ message: `Phiếu đang ở trạng thái '${result.currentStatus}', cần được lãnh đạo duyệt trước khi gán xe.` });
    }
    if (result.error === 'VEHICLE_CONFLICT') {
      return res.status(409).json({
        message: `Xe này đã được gán cho phiếu ${result.conflict.registration_number} cùng ngày (đi ${result.conflict.destination} lúc ${result.conflict.departure_time || '?'}). Vui lòng chọn xe khác hoặc đổi lịch.`
      });
    }

    res.json({ message: 'Gán xe thành công. Đã hiển thị trong Lịch tuần.' });
  } catch (error) {
    console.error('Lỗi assignVehicle:', error); // In lỗi ra Terminal để kiểm tra nếu còn sự cố
    res.status(500).json({ message: error.message });
  }
};

/**
 * Từ chối phiếu — dùng được ở bước 'pending' (lãnh đạo từ chối yêu cầu) hoặc
 * 'approved' (điều phối từ chối vì không sắp được xe).
 */
export const rejectVehicleRegistration = async (req, res) => {
  try {
    const { reason } = req.body; // Không bắt buộc
    const result = await VehicleRegistration.reject(req.params.id, req.user.id, reason);
    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });
    }
    if (result.error === 'INVALID_STATUS') {
      return res.status(400).json({ message: `Phiếu đang ở trạng thái '${result.currentStatus}', không thể từ chối.` });
    }
    res.json({ message: 'Đã từ chối đăng ký xe.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Ghép chuyến (carpool) ---

/**
 * Gợi ý các phiếu đã duyệt/xếp lịch cùng ngày + điểm đến, để người
 * đang định tạo phiếu mới có thể tham gia thay vì tạo phiếu/gán xe riêng.
 * Chỉ cần cùng NGÀY + ĐIỂM ĐẾN là đủ (không bắt buộc trùng giờ).
 * Query params: registration_date, destination
 */
export const getMergeSuggestions = async (req, res) => {
  try {
    const { registration_date, destination } = req.query;
    if (!registration_date || !destination) {
      return res.json({ data: [] });
    }
    // Model findMergeCandidates đã bỏ điều kiện departure_time
    const candidates = await VehicleRegistration.findMergeCandidates({ registration_date, destination });
    res.json({ data: candidates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Tham gia (ghép chuyến) vào một phiếu đã 'approved'/'scheduled' có sẵn, thay vì tạo
 * phiếu mới. Thêm phòng ban của người gọi vào phiếu đích.
 * Gửi thông báo cho người có quyền duyệt (APPROVE_VEHICLE_REGISTRATION) và điều phối (COORDINATE_VEHICLE)
 * để họ biết có thêm phòng ban/người tham gia chuyến đã được duyệt.
 */
export const joinVehicleRegistration = async (req, res) => {
  try {
    const { department_ids, note, participants: newParticipants } = req.body;
    if (!Array.isArray(department_ids) || department_ids.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn phòng ban tham gia ghép chuyến.' });
    }
    const result = await VehicleRegistration.joinExisting(req.params.id, department_ids, req.user.id, note, newParticipants);
    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });
    }
    if (result.error === 'INVALID_STATUS') {
      return res.status(400).json({ message: `Chuyến này đang ở trạng thái '${result.currentStatus}', chỉ có thể ghép vào chuyến đã được duyệt.` });
    }

    // Gửi thông báo cho người có quyền duyệt và điều phối
    try {
      const regNumber = result.registration_number || `#${req.params.id}`;
      // Gửi cho tất cả admin
      await createNotification(null, 'Ghép chuyến xe',
        `Có phòng ban mới tham gia vào chuyến ${regNumber}${newParticipants ? ` (thêm: ${newParticipants})` : ''}. Vui lòng kiểm tra và cập nhật lịch trình nếu cần.`,
        'info'
      );
    } catch (notifErr) {
      console.error('Lỗi gửi thông báo ghép chuyến:', notifErr.message);
    }

    res.json({ message: 'Ghép chuyến thành công.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Upload / Download file đính kèm ---

/**
 * Upload file đính kèm cho phiếu đăng ký xe.
 * Chấp nhận: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, CSV (tối đa 10MB).
 * Chỉ cho upload khi phiếu đang 'pending' hoặc 'rejected'.
 */
export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file để tải lên.' });
    }

    const registration = await VehicleRegistration.findById(req.params.id);
    if (!registration) {
      // Xóa file đã upload nếu phiếu không tồn tại
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });
    }

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && !['pending', 'rejected'].includes(registration.status)) {
      // Xóa file đã upload
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'Phiếu đã được duyệt, không thể thay đổi file đính kèm.' });
    }

    // Lưu đường dẫn file
    const attachmentPath = req.file.filename; // Chỉ lưu tên file, ghép với /api/download/ khi lấy
    const documentName = req.file.originalname;

    await VehicleRegistration.update(req.params.id, {
      attachment_path: attachmentPath,
      document_name: documentName
    }, req.user.id);

    res.json({
      message: 'Tải file đính kèm thành công.',
      data: {
        attachment_path: attachmentPath,
        document_name: documentName
      }
    });
  } catch (error) {
    // Xóa file nếu có lỗi
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: error.message });
  }
};

/**
 * Xóa file đính kèm của phiếu đăng ký xe.
 */
export const deleteAttachment = async (req, res) => {
  try {
    const registration = await VehicleRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });
    }

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && !['pending', 'rejected'].includes(registration.status)) {
      return res.status(400).json({ message: 'Phiếu đã được duyệt, không thể xóa file đính kèm.' });
    }

    if (registration.attachment_path) {
      const filePath = path.resolve(__dirname, '../../uploads', registration.attachment_path);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Lỗi xóa file:', err.message);
      });
    }

    await VehicleRegistration.update(req.params.id, {
      attachment_path: null,
      document_name: null
    }, req.user.id);

    res.json({ message: 'Xóa file đính kèm thành công.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
