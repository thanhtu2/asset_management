import pool from '../config/database.js';
import { buildPaginationQuery, getPagination } from '../ultis/pagination.js';
import AuditLog from './AuditLog.js';

/**
 * Luồng trạng thái:
 *   pending   -> chờ lãnh đạo duyệt (người tạo gửi phiếu, KHÔNG chọn xe)
 *   approved  -> lãnh đạo đã duyệt, chờ điều phối gán xe cụ thể
 *   scheduled -> điều phối đã gán xe -> hiển thị trong Lịch tuần
 *   rejected  -> bị từ chối ở bước 'pending' hoặc 'approved'
 *   cancelled -> người tạo tự hủy (không dùng trong bộ API hiện tại, để dành)
 *
 * Sửa nội dung (update): chỉ cho phép khi 'pending' hoặc 'rejected' (rejected sẽ tự
 * chuyển về 'pending' để lãnh đạo duyệt lại — xem update()).
 */
class VehicleRegistration {
  static async create(registrationData, userId) {
    const { 
      registration_number, registration_date, departure_time, 
      destination, departure_location, participants, notes, department_ids,
      attachment_path, document_name 
    } = registrationData;
    // Người tạo phiếu KHÔNG được chọn xe — vehicle_id chỉ do điều phối viên gán ở bước 3 (assignVehicle()).
    // status luôn bắt đầu ở 'pending' bất kể client gửi gì.

    const finalRegNumber = registration_number || `REG-${Date.now()}`;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO vehicle_registrations (registration_number, vehicle_id, requester_id, registration_date, departure_time, destination, departure_location, participants, notes, status, attachment_path, document_name)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
          finalRegNumber,
          userId,
          registration_date || null,
          departure_time || null,
          destination || null,
          departure_location || null,
          participants || null,
          notes,
          attachment_path || null,
          document_name || null
        ]
      );

      const registrationId = result.insertId;

      if (department_ids && Array.isArray(department_ids) && department_ids.length > 0) {
        const values = department_ids.map(deptId => [registrationId, deptId]);
        await connection.query(
          'INSERT INTO vehicle_registration_departments (registration_id, department_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      await AuditLog.log(userId, 'CREATE', 'vehicle_registrations', registrationId, null, { ...registrationData, registration_number: finalRegNumber }, `Tạo mới đăng ký xe ${finalRegNumber} đi ${destination}`);
      return registrationId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findAll(filters, page, limit) {
    let query = `
      SELECT vr.id, vr.registration_number, vr.requester_id, vr.vehicle_id, vr.registration_date, vr.departure_time, 
             vr.destination, vr.departure_location, vr.participants, vr.notes, vr.status, vr.created_at, vr.updated_at,
             vr.attachment_path, vr.document_name,
             v.plate_number, v.brand, v.model, u.fullName as requester_name,
             (SELECT GROUP_CONCAT(d.name SEPARATOR ', ') 
              FROM vehicle_registration_departments vrd 
              JOIN departments d ON vrd.department_id = d.id 
              WHERE vrd.registration_id = vr.id) as department_names
      FROM vehicle_registrations vr
      LEFT JOIN vehicles v ON vr.vehicle_id = v.id
      LEFT JOIN users u ON vr.requester_id = u.id
      WHERE 1=1
    `;
    const filterParams = [];

    if (filters.search) {
      query += ` AND (vr.registration_number LIKE ? OR v.plate_number LIKE ? OR v.brand LIKE ? OR vr.destination LIKE ? OR vr.departure_location LIKE ? OR u.fullName LIKE ?)`;
      filterParams.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    // Lọc theo phòng ban: Hiển thị đăng ký nếu nó liên quan đến phòng ban này
    if (filters.department_id) {
      query += ` AND EXISTS (SELECT 1 FROM vehicle_registration_departments vrd2 WHERE vrd2.registration_id = vr.id AND vrd2.department_id = ?)`;
      filterParams.push(filters.department_id);
    }

    if (filters.requester_id) {
      query += ` AND vr.requester_id = ?`;
      filterParams.push(filters.requester_id);
    }
    if (filters.vehicle_id) {
      query += ` AND vr.vehicle_id = ?`;
      filterParams.push(filters.vehicle_id);
    }
    if (filters.status) {
      query += ` AND vr.status = ?`;
      filterParams.push(filters.status);
    }
    if (filters.startDate && filters.endDate) {
      query += ` AND vr.registration_date BETWEEN ? AND ?`;
      filterParams.push(filters.startDate, filters.endDate);
    }

    const { paginatedQuery, countQuery, limitNum, offset } = buildPaginationQuery(query, page, limit, 'vr.created_at DESC');

    const paginatedQueryParams = [...filterParams, limitNum, offset];

    const [rows] = await pool.query(paginatedQuery, paginatedQueryParams);
    const [totalRes] = await pool.query(countQuery, filterParams);
    const total = totalRes[0].count;
    const pagination = getPagination(page, limit, total);

    return { data: rows, pagination };
  }

  static async update(id, registrationData, userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const oldData = await this.findById(id);
      if (!oldData) {
        await connection.rollback();
        return { affectedRows: 0 };
      }

      const {
        registration_number, registration_date, departure_time,
        destination, departure_location, participants, notes, department_ids,
        attachment_path, document_name
      } = registrationData;
      // vehicle_id và status CỐ Ý không được nhận ở đây — luôn giữ nguyên/tự chuyển.
      // Đổi vehicle_id/duyệt/từ chối phải đi qua assignVehicle() / approve() / reject().

      // Sửa phiếu đang 'rejected' đồng nghĩa với việc nộp lại -> tự chuyển về 'pending'
      // để lãnh đạo duyệt lại từ đầu. Nếu đang 'pending' thì giữ nguyên 'pending'.
      const nextStatus = oldData.status === 'rejected' ? 'pending' : oldData.status;

      const [result] = await connection.query(
        `UPDATE vehicle_registrations SET
          registration_number = ?, registration_date = ?,
          departure_time = ?, destination = ?, departure_location = ?, participants = ?,
          notes = ?, status = ?, attachment_path = ?, document_name = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          registration_number !== undefined ? registration_number : oldData.registration_number,
          registration_date || oldData.registration_date,
          departure_time || oldData.departure_time,
          destination || oldData.destination,
          departure_location !== undefined ? departure_location : oldData.departure_location,
          participants || oldData.participants,
          notes !== undefined ? notes : oldData.notes,
          nextStatus,
          attachment_path !== undefined ? attachment_path : oldData.attachment_path,
          document_name !== undefined ? document_name : oldData.document_name,
          id
        ]
      );

      await connection.query('DELETE FROM vehicle_registration_departments WHERE registration_id = ?', [id]);
      if (department_ids && Array.isArray(department_ids) && department_ids.length > 0) {
        const values = department_ids.map(deptId => [id, deptId]);
        await connection.query(
          'INSERT INTO vehicle_registration_departments (registration_id, department_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      await AuditLog.log(userId, 'UPDATE', 'vehicle_registrations', id, oldData, { ...registrationData, status: nextStatus }, `Cập nhật đăng ký xe đi ${destination || oldData.destination}${nextStatus === 'pending' && oldData.status === 'rejected' ? ' (nộp lại sau khi bị từ chối)' : ''}`);
      return { affectedRows: result.affectedRows, resubmitted: oldData.status === 'rejected' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT vr.id, vr.registration_number, vr.requester_id, vr.vehicle_id, vr.registration_date, vr.departure_time,
              vr.destination, vr.departure_location, vr.participants, vr.notes, vr.status, vr.created_at, vr.updated_at,
              vr.attachment_path, vr.document_name,
              v.plate_number, v.brand, v.model, u.fullName as requester_name,
              (SELECT JSON_ARRAYAGG(department_id) FROM vehicle_registration_departments WHERE registration_id = vr.id) as department_ids
       FROM vehicle_registrations vr
       LEFT JOIN vehicles v ON vr.vehicle_id = v.id
       LEFT JOIN users u ON vr.requester_id = u.id
       WHERE vr.id = ?`,
      [id]
    );
    if (rows[0] && typeof rows[0].department_ids === 'string') {
      rows[0].department_ids = JSON.parse(rows[0].department_ids);
    }
    return rows[0];
  }

  static async delete(id, userId) {
    const oldData = await this.findById(id);
    if (!oldData) return 0;
    const [result] = await pool.query('DELETE FROM vehicle_registrations WHERE id = ?', [id]);
    await AuditLog.log(userId, 'DELETE', 'vehicle_registrations', id, oldData, null, `Xóa đăng ký xe đi ${oldData.destination}`);
    return result.affectedRows;
  }

  /**
   * Kiểm tra xe đã được gán cho một phiếu khác trùng ngày chưa (chặn double-booking).
   * So sánh mức ngày (registration_date) vì phiếu chỉ có 1 mốc giờ khởi hành, không có
   * giờ kết thúc để so khoảng giao nhau chính xác.
   */
  static async findVehicleConflict(vehicle_id, registration_date, excludeId = null) {
    let query = `
      SELECT id, registration_number, departure_time, destination
      FROM vehicle_registrations
      WHERE vehicle_id = ? AND registration_date = ?
        AND status = 'scheduled'
    `;
    const params = [vehicle_id, registration_date];
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  }

  /**
   * Bước 2: Người có quyền APPROVE_VEHICLE_REGISTRATION (lãnh đạo) duyệt phiếu.
   * Chỉ cho phép khi phiếu đang 'pending'. Sau bước này phiếu chuyển 'approved',
   * chờ điều phối viên gán xe.
   */
  static async approve(id, userId) {
    const oldData = await this.findById(id);
    if (!oldData) return { error: 'NOT_FOUND' };
    if (oldData.status !== 'pending') {
      return { error: 'INVALID_STATUS', currentStatus: oldData.status };
    }
    const [result] = await pool.query(
      `UPDATE vehicle_registrations SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'`,
      [id]
    );
    if (result.affectedRows > 0) {
      await AuditLog.log(userId, 'UPDATE', 'vehicle_registrations', id, oldData, { status: 'approved' }, `Duyệt yêu cầu đăng ký xe ${oldData.registration_number}`);
    }
    return { affectedRows: result.affectedRows };
  }

  /**
   * Bước 3: Người có quyền COORDINATE_VEHICLE gán xe cụ thể cho phiếu đã được duyệt.
   * Chỉ cho phép khi phiếu đang 'approved'. Sau bước này phiếu chuyển 'scheduled'
   * và hiển thị trong Lịch tuần.
   */
  static async assignVehicle(id, vehicle_id, userId) {
    const oldData = await this.findById(id);
    if (!oldData) return { error: 'NOT_FOUND' };
    if (oldData.status !== 'approved') {
      return { error: 'INVALID_STATUS', currentStatus: oldData.status };
    }

    const conflict = await this.findVehicleConflict(vehicle_id, oldData.registration_date, id);
    if (conflict) {
      return { error: 'VEHICLE_CONFLICT', conflict };
    }

    const [result] = await pool.query(
      `UPDATE vehicle_registrations SET vehicle_id = ?, status = 'scheduled', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'approved'`,
      [vehicle_id, id]
    );
    if (result.affectedRows > 0) {
      await AuditLog.log(userId, 'UPDATE', 'vehicle_registrations', id, oldData, { vehicle_id, status: 'scheduled' }, `Gán xe cho đăng ký ${oldData.registration_number}`);
    }
    return { affectedRows: result.affectedRows };
  }

  /**
   * Từ chối phiếu — cho phép ở bước 'pending' (lãnh đạo từ chối yêu cầu) hoặc
   * 'approved' (điều phối từ chối vì không sắp được xe). Lý do (reason) không bắt buộc.
   */
  static async reject(id, userId, reason) {
    const oldData = await this.findById(id);
    if (!oldData) return { error: 'NOT_FOUND' };
    if (!['pending', 'approved'].includes(oldData.status)) {
      return { error: 'INVALID_STATUS', currentStatus: oldData.status };
    }
    const rejectNote = reason ? `${oldData.notes || ''}\n[Từ chối] ${reason}`.trim() : oldData.notes;
    const [result] = await pool.query(
      `UPDATE vehicle_registrations SET status = 'rejected', notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [rejectNote, id]
    );
    if (result.affectedRows > 0) {
      await AuditLog.log(userId, 'UPDATE', 'vehicle_registrations', id, oldData, { status: 'rejected', reason }, `Từ chối đăng ký xe ${oldData.registration_number}${reason ? `: ${reason}` : ''}`);
    }
    return { affectedRows: result.affectedRows };
  }

  /**
   * Gợi ý ghép chuyến: tìm các phiếu đã qua duyệt (status 'approved' hoặc 'scheduled')
   * trùng ngày + điểm đến, để người tạo phiếu mới có thể "tham gia"
   * (ghép đoàn) thay vì tạo một phiếu/xe riêng.
   * Cải tiến: Chỉ cần trùng ngày, không bắt buộc trùng từng phút.
   */
  static async findMergeCandidates({ registration_date, destination }) {
    if (!registration_date || !destination) return [];
    let query = `
      SELECT vr.id, vr.registration_number, vr.status, vr.departure_time, vr.destination, vr.departure_location,
             vr.participants, v.plate_number, u.fullName as requester_name,
             (SELECT GROUP_CONCAT(d.name SEPARATOR ', ')
              FROM vehicle_registration_departments vrd
              JOIN departments d ON vrd.department_id = d.id
              WHERE vrd.registration_id = vr.id) as department_names
      FROM vehicle_registrations vr
      LEFT JOIN vehicles v ON vr.vehicle_id = v.id
      LEFT JOIN users u ON vr.requester_id = u.id
      WHERE vr.registration_date = ?
        AND LOWER(TRIM(vr.destination)) = LOWER(TRIM(?))
        AND vr.status IN ('approved', 'scheduled')
      ORDER BY vr.departure_time ASC
      LIMIT 10
    `;
    const params = [registration_date, destination];
    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Ghép đoàn: thêm (các) phòng ban của người yêu cầu vào một phiếu đã được duyệt/xếp
   * lịch sẵn (KHÔNG tạo phiếu mới). Chỉ hợp lệ khi phiếu đích đang 'approved' hoặc
   * 'scheduled' — không ghép vào phiếu còn 'pending' vì phiếu đó chưa chắc được duyệt.
   */
  static async joinExisting(targetId, department_ids, userId, note, newParticipants) {
    const target = await this.findById(targetId);
    if (!target) return { error: 'NOT_FOUND' };
    if (!['approved', 'scheduled'].includes(target.status)) {
      return { error: 'INVALID_STATUS', currentStatus: target.status };
    }
    if (!Array.isArray(department_ids) || department_ids.length === 0) {
      return { error: 'NO_DEPARTMENTS' };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 1. Cập nhật phòng ban tham gia (Many-to-Many)
      const values = department_ids.map(deptId => [targetId, deptId]);
      await connection.query(
        'INSERT IGNORE INTO vehicle_registration_departments (registration_id, department_id) VALUES ?',
        [values]
      );

      // 2. Cộng dồn danh sách người tham gia
      let updatedParticipants = target.participants || '';
      if (newParticipants) {
        updatedParticipants = updatedParticipants 
          ? `${updatedParticipants}, ${newParticipants}`
          : newParticipants;
      }

      const mergedNote = note ? `${target.notes || ''}\n[Ghép chuyến] ${note}`.trim() : target.notes;
      
      await connection.query(
        `UPDATE vehicle_registrations SET participants = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [updatedParticipants, mergedNote, targetId]
      );

      await connection.commit();
      
      // 3. Ghi log
      await AuditLog.log(userId, 'UPDATE', 'vehicle_registrations', targetId, target, { department_ids, note, participants: updatedParticipants }, `Ghép chuyến vào đăng ký xe ${target.registration_number}`);
      
      return { affectedRows: 1, registration_number: target.registration_number };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default VehicleRegistration;
