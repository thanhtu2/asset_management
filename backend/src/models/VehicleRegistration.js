import pool from '../config/database.js';
import { buildPaginationQuery, getPagination } from '../ultis/pagination.js';
import AuditLog from './AuditLog.js';

class VehicleRegistration {
  static async create(registrationData, userId) {
    const { 
      registration_number, vehicle_id, registration_date, departure_time, 
      destination, departure_location, participants, notes, status, department_ids 
    } = registrationData;
    
    const finalRegNumber = registration_number || `REG-${Date.now()}`;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO vehicle_registrations (registration_number, vehicle_id, requester_id, registration_date, departure_time, destination, departure_location, participants, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalRegNumber,
          vehicle_id || null,
          userId,
          registration_date || null, 
          departure_time || null,
          destination || null,
          departure_location || null,
          participants || null,
          notes, 
          status || 'pending'
        ]
      );

      const registrationId = result.insertId;

      // Lưu danh sách phòng ban
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
    // Hàm update sẽ gọi findById bên dưới
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const oldData = await this.findById(id);
      if (!oldData) {
        await connection.rollback();
        return 0;
      }

      const {
        registration_number, vehicle_id, registration_date, departure_time,
        destination, departure_location, participants, notes, status, department_ids
      } = registrationData;

      const [result] = await connection.query(
        `UPDATE vehicle_registrations SET
          registration_number = ?, vehicle_id = ?, registration_date = ?,
          departure_time = ?, destination = ?, departure_location = ?, participants = ?,
          notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          registration_number !== undefined ? registration_number : oldData.registration_number,
          vehicle_id || oldData.vehicle_id,
          registration_date || oldData.registration_date,
          departure_time || oldData.departure_time,
          destination || oldData.destination,
          departure_location !== undefined ? departure_location : oldData.departure_location,
          participants || oldData.participants,
          notes !== undefined ? notes : oldData.notes,
          status || oldData.status,
          id
        ]
      );

      // Update department_ids
      await connection.query('DELETE FROM vehicle_registration_departments WHERE registration_id = ?', [id]);
      if (department_ids && Array.isArray(department_ids) && department_ids.length > 0) {
        const values = department_ids.map(deptId => [id, deptId]);
        await connection.query(
          'INSERT INTO vehicle_registration_departments (registration_id, department_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      await AuditLog.log(userId, 'UPDATE', 'vehicle_registrations', id, oldData, registrationData, `Cập nhật đăng ký xe đi ${destination || oldData.destination}`);
      return result.affectedRows;
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
}

export default VehicleRegistration;