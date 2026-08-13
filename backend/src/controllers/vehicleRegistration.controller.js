import * as XLSX from 'xlsx';
import pool from '../config/database.js';
import VehicleRegistration from '../models/VehicleRegistration.js';
import { createNotification } from '../notification.service.js';
import AuditLog from '../models/AuditLog.js';

// Khi gửi qua multipart/form-data (có kèm file), mọi field text đều đến dưới dạng
// chuỗi — kể cả mảng department_ids (được frontend JSON.stringify trước khi append).
// Helper này chuẩn hoá department_ids về đúng kiểu mảng số trong mọi trường hợp.
const parseDeptIds = (raw) => {
  if (raw === undefined || raw === null) return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

export const createVehicleRegistration = async (req, res) => {
  try {
    const { registration_date, destination, departure_location } = req.body;
    if (!registration_date || !destination || !departure_location) {
      return res.status(400).json({ message: 'Ngày khởi hành, điểm đi và điểm đến là bắt buộc.' });
    }
    
    let attachment_path = null;
    if (req.file) {
      attachment_path = `/uploads/${req.file.filename}`;
    }

    // Whitelist tường minh — người tạo phiếu tuyệt đối KHÔNG được gửi vehicle_id/status
    const { departure_time, participants, notes, department_ids } = req.body;
    const newRegistrationId = await VehicleRegistration.create({
      registration_date, destination, departure_location,
      departure_time, participants, notes, department_ids: parseDeptIds(department_ids),
      attachment_path
    }, req.user.id);
    res.status(201).json({ message: 'Thêm đăng ký xe thành công', id: newRegistrationId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveRegistration = async (req, res) => {
  try {
    const { affected, reason } = await VehicleRegistration.approve(req.params.id, req.user.id);
    if (reason === 'NOT_FOUND') return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });
    if (reason === 'INVALID_STATUS' || affected === 0) {
      return res.status(400).json({ message: 'Chỉ có thể duyệt phiếu đang ở trạng thái "Chờ duyệt".' });
    }
    res.json({ message: 'Đã duyệt yêu cầu thành công.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectRegistration = async (req, res) => {
  try {
    const { reason } = req.body;
    const { affected, reason: failReason } = await VehicleRegistration.reject(req.params.id, req.user.id, reason);
    if (failReason === 'NOT_FOUND') return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });
    if (failReason === 'INVALID_STATUS' || affected === 0) {
      return res.status(400).json({ message: 'Chỉ có thể từ chối phiếu đang ở trạng thái "Chờ duyệt".' });
    }
    res.json({ message: 'Đã từ chối yêu cầu.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignVehicle = async (req, res) => {
  try {
    const { vehicle_id } = req.body;
    if (!vehicle_id) return res.status(400).json({ message: 'Vui lòng chọn xe để gán.' });

    const { affected, reason, conflict } = await VehicleRegistration.assignVehicle(req.params.id, vehicle_id, req.user.id);
    if (reason === 'NOT_FOUND') return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });
    if (reason === 'VEHICLE_CONFLICT') {
      return res.status(409).json({
        message: `Xe này đã được gán cho phiếu ${conflict.registration_number} cùng ngày (giờ ${conflict.departure_time || '?'}, điểm đến: ${conflict.destination || '?'}). Vui lòng chọn xe khác hoặc đổi lịch.`
      });
    }
    if (reason === 'INVALID_STATUS' || affected === 0) {
      return res.status(400).json({ message: 'Chỉ có thể gán xe cho phiếu đã được duyệt.' });
    }
    res.json({ message: 'Đã gán xe và lên lịch thành công.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Hủy phiếu đăng ký xe — áp dụng được cả khi xe đã được gán/lên lịch (status = 'scheduled'),
// khác với reject (chỉ dùng cho phiếu đang 'pending'). Chỉ chủ phiếu hoặc điều phối viên mới được hủy.
export const cancelRegistration = async (req, res) => {
  try {
    const registration = await VehicleRegistration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });

    const isOwner = registration.requester_id === req.user.id;
    const canCoordinate = req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('COORDINATE_VEHICLE'));
    if (!isOwner && !canCoordinate) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy phiếu đăng ký này.' });
    }

    const { reason } = req.body;
    const { affected, reason: failReason } = await VehicleRegistration.cancel(req.params.id, req.user.id, reason);
    if (failReason === 'NOT_FOUND') return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });
    if (failReason === 'INVALID_STATUS' || affected === 0) {
      return res.status(400).json({ message: 'Không thể hủy phiếu đã bị từ chối, đã hủy hoặc đã hoàn thành.' });
    }
    res.json({ message: 'Đã hủy chuyến đi thành công.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//lấy api xem chi tiết thay đổi
export const getChangeDetails = async (req, res) => {
   try {
     const [changes] = await pool.query(
       'SELECT * FROM vehicle_registration_changes WHERE id = ?',
       [req.params.changeId]
     );
     if (changes.length === 0) return res.status(404).json({ message: 'Không tìm thấy yêu cầu thay đổi.' });

     // Đảm bảo trả về dưới dạng Object nếu lưu là JSON trong DB
     const data = typeof changes[0].requested_data === 'string'
       ? JSON.parse(changes[0].requested_data)
       : changes[0].requested_data;
     res.json({ ...changes[0], requested_data: data });
   } catch (error) {
     res.status(500).json({ message: error.message });
   }
 };

export const requestChange = async (req, res) => {
  try {
    const registration = await VehicleRegistration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });

    // Chỉ chủ phiếu, admin, hoặc điều phối viên mới được gửi yêu cầu thay đổi cho phiếu này
    const isOwner = registration.requester_id === req.user.id;
    const canCoordinate = req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('COORDINATE_VEHICLE'));
    if (!isOwner && !canCoordinate) {
      return res.status(403).json({ message: 'Bạn không có quyền gửi yêu cầu thay đổi cho phiếu này.' });
    }

    // Chỉ gửi được yêu cầu thay đổi khi phiếu đã được duyệt / đã lên lịch
    if (!['approved', 'scheduled'].includes(registration.status)) {
      return res.status(400).json({ message: 'Chỉ có thể gửi yêu cầu thay đổi cho phiếu đã được duyệt hoặc đã lên lịch.' });
    }

    let attachment_path = null;
    if (req.file) {
      attachment_path = `/uploads/${req.file.filename}`;
    }
    // Whitelist field được phép đổi — không cho đổi vehicle_id/status qua đường này
    const { registration_date, departure_time, destination, departure_location, participants, notes, department_ids } = req.body;
    const requestedData = { registration_date, departure_time, destination, departure_location, participants, notes, department_ids: parseDeptIds(department_ids), attachment_path };
   
    console.log('DEBUG: requestedData to stringify:', requestedData);
    await pool.query(
     `INSERT INTO vehicle_registration_changes (registration_id, requested_data, status) VALUES (?, ?, 'pending')`,
     [req.params.id, JSON.stringify(requestedData)]
   );

    await pool.query('UPDATE vehicle_registrations SET status = "pending_change" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Đã gửi yêu cầu thay đổi thành công.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveChangeRequest = async (req, res) => {
  const connection = await pool.getConnection();
  console.log('DEBUG: Starting approveChangeRequest for ID:', req.params.changeId);
  try {
    await connection.beginTransaction();
    const [changes] = await connection.query('SELECT * FROM vehicle_registration_changes WHERE id = ? AND registration_id = ?', [req.params.changeId, req.params.id]);
    if (changes.length === 0) throw new Error('Yêu cầu không tồn tại');
    if (changes[0].status !== 'pending') throw new Error('Yêu cầu này đã được xử lý trước đó.');

    console.log('DEBUG: Raw requested_data:', changes[0].requested_data);
    
    // Kiểm tra nếu dữ liệu là object thì dùng luôn, nếu là string thì parse
    let data;
    if (typeof changes[0].requested_data === 'object' && changes[0].requested_data !== null) {
      data = changes[0].requested_data;
    } else {
      data = JSON.parse(changes[0].requested_data);
    }
    console.log('DEBUG: Parsed data:', data);

    const [regRows] = await connection.query('SELECT * FROM vehicle_registrations WHERE id = ?', [req.params.id]);
    if (regRows.length === 0) throw new Error('Không tìm thấy đăng ký xe.');
    const registration = regRows[0];

    // Nếu phiếu đã có xe gán (đang 'scheduled') trước khi có yêu cầu thay đổi,
    // sau khi duyệt thay đổi vẫn giữ nguyên xe/trạng thái đã lên lịch.
    // Ngược lại quay về 'approved' (đang chờ điều phối viên gán xe).
    const revertStatus = registration.vehicle_id ? 'scheduled' : 'approved';

    console.log('DEBUG: Updating vehicle_registrations...');
    await connection.query(
      `UPDATE vehicle_registrations SET 
         registration_date = ?, departure_time = ?, destination = ?, departure_location = ?,
         participants = ?, notes = ?, attachment_path = ?, status = ?
       WHERE id = ?`,
      [
        data.registration_date || registration.registration_date,
        data.departure_time || registration.departure_time,
        data.destination || registration.destination,
        data.departure_location !== undefined ? data.departure_location : registration.departure_location,
        data.participants !== undefined ? data.participants : registration.participants,
        data.notes !== undefined ? data.notes : registration.notes,
        data.attachment_path || registration.attachment_path,
        revertStatus,
        req.params.id
      ]
    );
    console.log('DEBUG: Updated vehicle_registrations successfully.');

    if (data.department_ids !== undefined) {
      console.log('DEBUG: Updating department_ids...');
      await connection.query('DELETE FROM vehicle_registration_departments WHERE registration_id = ?', [req.params.id]);
      if (Array.isArray(data.department_ids) && data.department_ids.length > 0) {
        const values = data.department_ids.map(deptId => [req.params.id, deptId]);
        await connection.query('INSERT INTO vehicle_registration_departments (registration_id, department_id) VALUES ?', [values]);
      }
      console.log('DEBUG: Updated department_ids successfully.');
    }

    await connection.query('UPDATE vehicle_registration_changes SET status = "approved" WHERE id = ?', [req.params.changeId]);
    console.log('DEBUG: Updated change request status.');

    await connection.commit();
    console.log('DEBUG: Transaction committed successfully.');
    res.json({ message: 'Đã phê duyệt thay đổi thành công.' });
  } catch (error) {
    console.error('DEBUG: Error in approveChangeRequest:', error);
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

export const rejectChangeRequest = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [changes] = await connection.query('SELECT * FROM vehicle_registration_changes WHERE id = ? AND registration_id = ?', [req.params.changeId, req.params.id]);
    if (changes.length === 0) throw new Error('Yêu cầu không tồn tại');
    if (changes[0].status !== 'pending') throw new Error('Yêu cầu này đã được xử lý trước đó.');

    const [regRows] = await connection.query('SELECT vehicle_id FROM vehicle_registrations WHERE id = ?', [req.params.id]);
    if (regRows.length === 0) throw new Error('Không tìm thấy đăng ký xe.');
    // Trả phiếu về đúng trạng thái trước khi có yêu cầu thay đổi
    const revertStatus = regRows[0].vehicle_id ? 'scheduled' : 'approved';

    await connection.query('UPDATE vehicle_registration_changes SET status = "rejected" WHERE id = ?', [req.params.changeId]);
    await connection.query('UPDATE vehicle_registrations SET status = ? WHERE id = ?', [revertStatus, req.params.id]);

    await connection.commit();
    res.json({ message: 'Đã từ chối yêu cầu thay đổi.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

export const updateVehicleRegistration = async (req, res) => {
  try {
    const registration = await VehicleRegistration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Không tìm thấy đăng ký xe.' });

    const isOwner = registration.requester_id === req.user.id;
    const canCoordinate = req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('COORDINATE_VEHICLE'));
    if (!isOwner && !canCoordinate) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa phiếu đăng ký này.' });
    }

    // Người dùng thường KHÔNG được sửa trực tiếp khi phiếu đã qua bước duyệt/lên lịch —
    // phải dùng chức năng "Gửi yêu cầu thay đổi". Chỉ điều phối viên/admin được sửa trực tiếp mọi lúc.
    if (!canCoordinate && !['pending', 'rejected'].includes(registration.status)) {
      return res.status(400).json({ message: 'Phiếu đã được duyệt/lên lịch. Vui lòng dùng chức năng "Gửi yêu cầu thay đổi".' });
    }

    let attachment_path = registration.attachment_path;
    if (req.file) {
      attachment_path = `/uploads/${req.file.filename}`;
    }
    // Whitelist — người dùng thường tuyệt đối không được tự đổi vehicle_id/status qua đây
    const { registration_number, registration_date, departure_time, destination, departure_location, participants, notes, department_ids } = req.body;
    const payload = { registration_number, registration_date, departure_time, destination, departure_location, participants, notes, department_ids: parseDeptIds(department_ids), attachment_path };
    if (canCoordinate && req.body.vehicle_id !== undefined) payload.vehicle_id = req.body.vehicle_id;
    if (canCoordinate && req.body.status !== undefined) payload.status = req.body.status;

    const affectedRows = await VehicleRegistration.update(req.params.id, payload, req.user.id, canCoordinate);
    if (affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy đăng ký xe để cập nhật.' });
    res.json({ message: 'Cập nhật đăng ký xe thành công.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllVehicleRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, vehicle_id, requester_id, department_id} = req.query;
    const filters = { search, vehicle_id, requester_id, department_id};
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

export const deleteVehicleRegistration = async (req, res) => {
  try {
    const registration = await VehicleRegistration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Không tìm thấy đăng ký xe để xóa.' });

    const isOwner = registration.requester_id === req.user.id;
    const canCoordinate = req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('COORDINATE_VEHICLE'));
    if (!isOwner && !canCoordinate) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa phiếu đăng ký này.' });
    }

    const affectedRows = await VehicleRegistration.delete(req.params.id, req.user.id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký xe để xóa.' });
    }
    res.json({ message: 'Xóa đăng ký xe thành công.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

 export const mergeRegistration = async (req, res) => {
   const connection = await pool.getConnection();
   try {
     await connection.beginTransaction();
     const { targetRegistrationId, newRegistrationId } = req.body;

     // 1. Lấy thông tin phiếu cũ và phiếu mới
     const [targetReg] = await connection.query('SELECT * FROM vehicle_registrations WHERE id = ?',
      [targetRegistrationId]);
     const [newReg] = await connection.query('SELECT * FROM vehicle_registrations WHERE id = ?',
      [newRegistrationId]);

      // 2. Cập nhật phòng ban phiếu cũ
      await connection.query(
        'INSERT IGNORE INTO vehicle_registration_departments (registration_id, department_id) SELECT ?, department_id FROM vehicle_registration_departments WHERE registration_id = ?',
       [targetRegistrationId, newRegistrationId]
     );

     // 3. Xóa phiếu mới
     await connection.query('DELETE FROM vehicle_registrations WHERE id = ?', [newRegistrationId]);

     // 4. Ghi Audit Log
     await AuditLog.create({
      user_id: req.user.id,
      action: 'MERGE_REGISTRATION',
      description: `Gộp phiếu ${newRegistrationId} vào phiếu ${targetRegistrationId}`,
      target_id: targetRegistrationId
     });

    // 5. Thông báo cho Điều phối viên (cần role/permission COORDINATE_VEHICLE)
    await createNotification({
       message: `Phiếu ${newRegistrationId} đã được gộp vào phiếu ${targetRegistrationId}`,
       type: 'INFO',
       permission_required: 'COORDINATE_VEHICLE'
     });

     await connection.commit();
     res.json({ message: 'Đã ghép chuyến thành công.' });
  } catch (error) {
     await connection.rollback();
     res.status(500).json({ message: error.message });
   } finally {
     connection.release();
   }
};

 // Tìm các phiếu cùng ngày + cùng điểm đến (dùng cho gợi ý ghép chuyến khi tạo/sửa phiếu)
 export const findSimilarTrips = async (req, res) => {
   try {
     const { registration_date, destination, exclude_id } = req.query;
     if (!registration_date || !destination) {
       return res.json([]);
     }

     let query = `
       SELECT vr.id, vr.registration_number, vr.registration_date, vr.departure_time,
              vr.destination, vr.status, vr.vehicle_id,
              v.plate_number, v.brand, v.model
       FROM vehicle_registrations vr
       LEFT JOIN vehicles v ON vr.vehicle_id = v.id
       WHERE vr.registration_date = ?
         AND vr.destination = ?
         AND vr.status NOT IN ('rejected', 'cancelled')
     `;
     const params = [registration_date, destination];

     // Khi đang sửa phiếu, không gợi ý ghép với chính phiếu đó
     if (exclude_id) {
       query += ` AND vr.id != ?`;
       params.push(exclude_id);
     }
     query += ` ORDER BY vr.departure_time ASC`;

     const [rows] = await pool.query(query, params);
     res.json(rows);
   } catch (error) {
     res.status(500).json({ message: error.message });
   }
 };

 export const addDepartmentToTrip = async (req, res) => {
   try {
     const registrationId = req.params.id;
     const { department_id } = req.body;
     if (!department_id) {
       return res.status(400).json({ message: 'Thiếu department_id.' });
     }

     const registration = await VehicleRegistration.findById(registrationId);
     if (!registration) return res.status(404).json({ message: 'Không tìm thấy chuyến đi để ghép.' });
     if (['rejected', 'cancelled'].includes(registration.status)) {
       return res.status(400).json({ message: 'Không thể ghép vào phiếu đã bị từ chối/hủy.' });
     }

     await pool.query(
       'INSERT IGNORE INTO vehicle_registration_departments (registration_id, department_id) VALUES (?, ?)',
       [registrationId, department_id]
     );
     await AuditLog.log(req.user.id, 'MERGE_DEPARTMENT', 'vehicle_registrations', registrationId, null,
       { department_id }, `Ghép phòng ban vào chuyến đi ${registration.registration_number}`);
     res.json({ message: 'Đã ghép vào chuyến thành công.' });
   } catch (error) {
     res.status(500).json({ message: error.message });
   }
 };

export const exportVehicleRegistrations = async (req, res) => {
  try {
    const { search, vehicle_id, requester_id } = req.query;
    let department_id = req.query.department_id;
    const canCoordinate = req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('COORDINATE_VEHICLE'));
    if (!canCoordinate) { department_id = req.user.department_id; }
    const filters = { search, vehicle_id, requester_id, department_id, startDate: req.query.startDate, endDate: req.query.endDate };
    const { data } = await VehicleRegistration.findAll(filters, 1, 1000000);
    const statusLabels = { 'pending': 'Chờ duyệt', 'approved': 'Đã duyệt', 'rejected': 'Từ chối', 'completed': 'Đã hoàn thành', 'cancelled': 'Đã hủy', 'scheduled': 'Đã lên lịch', 'pending_change': 'Chờ duyệt thay đổi' };
    const formatDate = (dateStr) => { if (!dateStr) return ''; const d = new Date(dateStr); if (isNaN(d.getTime())) return ''; const day = String(d.getDate()).padStart(2, '0'); const month = String(d.getMonth() + 1).padStart(2, '0'); const year = d.getFullYear(); return `${day}/${month}/${year}`; };
    const countParticipants = (participants) => { if (!participants || participants.trim() === '') return 0; return participants.split(',').filter(p => p.trim() !== '').length; };
    const mappedData = data.map(reg => ({ 'Số đăng ký': reg.registration_number, 'Biển số xe': reg.plate_number || 'Chưa gán', 'Nhãn hiệu/Tên xe': reg.brand ? `${reg.brand} ${reg.model || ''}`.trim() : 'Chưa gán', 'Phòng ban tham gia': reg.department_names || '', 'Người đăng ký': reg.requester_name || '', 'Ngày khởi hành': formatDate(reg.registration_date), 'Thời gian khởi hành': reg.departure_time || '', 'Điểm đi': reg.departure_location || '', 'Địa điểm đến': reg.destination || '', 'Thành phần tham gia': reg.participants || '', 'Số lượng tham gia': countParticipants(reg.participants), 'Trạng thái': statusLabels[reg.status] || 'Chờ duyệt', 'Ghi chú': reg.notes || '' }));
    const ws = XLSX.utils.json_to_sheet(mappedData); ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 30 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Đăng ký xe');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="danh_sach_dang_ky_xe.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) { console.error('exportVehicleRegistrations error:', error); res.status(500).json({ message: error.message }); }
};