// import pool from '../config/database.js'; 
// import { buildPaginationQuery, getPagination } from '../ultis/pagination.js';
// import AuditLog from './AuditLog.js';

// class VehicleTrip {
//   static async create(tripData, userId) {
//     const { vehicle_id, driver_id, departure_location, destination, start_time, end_time, start_km, end_km, purpose, status, notes } = tripData;
//     const [result] = await pool.query(
//       `INSERT INTO vehicle_trips (vehicle_id, driver_id, requester_id, departure_location, destination, start_time, end_time, start_km, end_km, purpose, status, notes)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         vehicle_id || null, 
//         driver_id || null, 
//         userId,
//         departure_location, 
//         destination, 
//         start_time || null, 
//         end_time || null, 
//         start_km || null, 
//         end_km || null, 
//         purpose, 
//         status || 'leader_pending', 
//         notes
//       ]
//     );
//     await AuditLog.log(userId, 'CREATE', 'vehicle_trips', result.insertId, null, tripData, `Ghi nhận lịch trình di chuyển mới`);
//     return result.insertId;
//   }

//   static async findAll(filters = {}, page = 1, limit = 10) {
//     let query = `
//       SELECT vt.id, vt.vehicle_id, vt.driver_id, vt.requester_id, 
//              vt.leader_id, vt.coordinator_id, vt.departure_location, vt.destination, 
//              vt.start_time, vt.end_time, vt.start_km, vt.end_km, vt.purpose, 
//              vt.status, vt.notes, vt.created_at,
//              v.plate_number, v.brand, vr.destination as reg_destination,
//              u.fullName as driver_name, vr.requester_id as registration_requester_id,
//              r.fullName as requester_name, l.fullName as leader_name, c.fullName as coordinator_name
//       FROM vehicle_trips vt
//       LEFT JOIN vehicles v ON vt.vehicle_id = v.id
//       LEFT JOIN vehicle_registrations vr ON vt.id = vr.trip_id
//       LEFT JOIN users u ON vt.driver_id = u.id
//       LEFT JOIN users r ON vt.requester_id = r.id
//       LEFT JOIN users l ON vt.leader_id = l.id
//       LEFT JOIN users c ON vt.coordinator_id = c.id
//       WHERE 1=1
//     `;
//     const filterParams = [];

//     if (filters && filters.vehicle_id) {
//       query += ` AND vt.vehicle_id = ?`;
//       filterParams.push(filters.vehicle_id);
//     }
//     if (filters && filters.driver_id) {
//       query += ` AND vt.driver_id = ?`;
//       filterParams.push(filters.driver_id);
//     }
//     if (filters && filters.search) {
//       query += ` AND (vt.departure_location LIKE ? OR vt.destination LIKE ? OR vt.purpose LIKE ?)`;
//       filterParams.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
//     }

//     const { paginatedQuery, countQuery, limitNum, offset } = buildPaginationQuery(query, page, limit, 'vt.start_time DESC');

//     const paginatedQueryParams = [...filterParams, limitNum, offset];

//     const [rows] = await pool.query(paginatedQuery, paginatedQueryParams);
//     const [totalRes] = await pool.query(countQuery, filterParams);
//     const total = totalRes[0].count;
    
//     return { data: rows, pagination: getPagination(page, limit, total) };
//   }

//   static async findById(id) {
//     const [rows] = await pool.query(`
//       SELECT vt.id, vt.vehicle_id, vt.driver_id, vt.requester_id, 
//              vt.leader_id, vt.coordinator_id, vt.departure_location, vt.destination, 
//              vt.start_time, vt.end_time, vt.start_km, vt.end_km, vt.purpose, vt.status, vt.notes,
//              v.plate_number, v.brand, u.fullName as driver_name, r.fullName as requester_name
//       FROM vehicle_trips vt 
//       LEFT JOIN vehicles v ON vt.vehicle_id = v.id 
//       LEFT JOIN users u ON vt.driver_id = u.id
//       LEFT JOIN users r ON vt.requester_id = r.id
//       WHERE vt.id = ?`, [id]);
//     return rows[0];
//   }

//   static async update(id, tripData) {
//     const { vehicle_id, driver_id, departure_location, destination, start_time, end_time, start_km, end_km, purpose, status, notes, leader_id, coordinator_id } = tripData;
//     const [result] = await pool.query(
//       `UPDATE vehicle_trips SET 
//        vehicle_id = ?, driver_id = ?, departure_location = ?, destination = ?, 
//         start_time = ?, end_time = ?, start_km = ?, end_km = ?, 
//         purpose = ?, status = ?, notes = ?, leader_id = ?, coordinator_id = ?
//        WHERE id = ?`,
//       [
//         vehicle_id || null, 
//         driver_id || null, 
//         departure_location, 
//         destination, 
//         start_time || null, 
//         end_time || null, 
//         start_km || null, 
//         end_km || null, 
//         purpose, 
//         status, 
//         notes,
//         leader_id || null,
//         coordinator_id || null,
//         id
//       ]
//     );
//     return result.affectedRows;
//   }

//   static async delete(id, userId) {
//     const oldData = await this.findById(id);
//     const [result] = await pool.query('DELETE FROM vehicle_trips WHERE id = ?', [id]);
//     await AuditLog.log(userId, 'DELETE', 'vehicle_trips', id, oldData, null, `Xóa lịch trình di chuyển`);
//     return result.affectedRows;
//   }
// }

// export default VehicleTrip;

import pool from '../config/database.js';
import { buildPaginationQuery, getPagination } from '../ultis/pagination.js';
import AuditLog from './AuditLog.js';

class VehicleTrip {
  static async create(tripData, userId) {
    const { vehicle_id, driver_id, departure_location, destination, start_time, end_time, start_km, end_km, purpose, status, notes } = tripData;
    const [result] = await pool.query(
      `INSERT INTO vehicle_trips (vehicle_id, driver_id, requester_id, departure_location, destination, start_time, end_time, start_km, end_km, purpose, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicle_id || null,
        driver_id || null,
        userId,
        departure_location,
        destination,
        start_time || null,
        end_time || null,
        start_km || null,
        end_km || null,
        purpose,
        status || 'leader_pending',
        notes || null
      ]
    );
    await AuditLog.log(userId, 'CREATE', 'vehicle_trips', result.insertId, null, tripData, `Ghi nhận lịch trình di chuyển mới`);
    return result.insertId;
  }

  static async findAll(filters = {}, page = 1, limit = 10) {
    let query = `
      SELECT vt.id, vt.vehicle_id, vt.driver_id, vt.requester_id,
             vt.leader_id, vt.coordinator_id, vt.departure_location, vt.destination,
             vt.start_time, vt.end_time, vt.start_km, vt.end_km, vt.purpose,
             vt.status, vt.notes, vt.created_at,
             v.plate_number, v.brand,
             u.fullName as driver_name,
             r.fullName as requester_name,
             l.fullName as leader_name,
             c.fullName as coordinator_name
      FROM vehicle_trips vt
      LEFT JOIN vehicles v ON vt.vehicle_id = v.id
      LEFT JOIN users u ON vt.driver_id = u.id
      LEFT JOIN users r ON vt.requester_id = r.id
      LEFT JOIN users l ON vt.leader_id = l.id
      LEFT JOIN users c ON vt.coordinator_id = c.id
      WHERE 1=1
    `;
    const filterParams = [];

    if (filters && filters.requester_id) {
      query += ` AND vt.requester_id = ?`;
      filterParams.push(filters.requester_id);
    }
    if (filters && filters.vehicle_id) {
      query += ` AND vt.vehicle_id = ?`;
      filterParams.push(filters.vehicle_id);
    }
    if (filters && filters.driver_id) {
      query += ` AND vt.driver_id = ?`;
      filterParams.push(filters.driver_id);
    }
    if (filters && filters.status) {
      query += ` AND vt.status = ?`;
      filterParams.push(filters.status);
    }
    if (filters && filters.search) {
      query += ` AND (vt.departure_location LIKE ? OR vt.destination LIKE ? OR vt.purpose LIKE ?)`;
      filterParams.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const { paginatedQuery, countQuery, limitNum, offset } = buildPaginationQuery(query, page, limit, 'vt.created_at DESC');

    const paginatedQueryParams = [...filterParams, limitNum, offset];

    const [rows] = await pool.query(paginatedQuery, paginatedQueryParams);
    const [totalRes] = await pool.query(countQuery, filterParams);
    const total = totalRes[0].count;

    return { data: rows, pagination: getPagination(page, limit, total) };
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT vt.id, vt.vehicle_id, vt.driver_id, vt.requester_id,
             vt.leader_id, vt.coordinator_id, vt.departure_location, vt.destination,
             vt.start_time, vt.end_time, vt.start_km, vt.end_km, vt.purpose, vt.status, vt.notes,
             v.plate_number, v.brand,
             u.fullName as driver_name,
             r.fullName as requester_name,
             l.fullName as leader_name,
             c.fullName as coordinator_name
      FROM vehicle_trips vt
      LEFT JOIN vehicles v ON vt.vehicle_id = v.id
      LEFT JOIN users u ON vt.driver_id = u.id
      LEFT JOIN users r ON vt.requester_id = r.id
      LEFT JOIN users l ON vt.leader_id = l.id
      LEFT JOIN users c ON vt.coordinator_id = c.id
      WHERE vt.id = ?`, [id]);
    return rows[0];
  }

  static async update(id, tripData, userId) {
    const oldData = await this.findById(id);
    if (!oldData) return 0;

    const {
      vehicle_id, driver_id, departure_location, destination,
      start_time, end_time, start_km, end_km,
      purpose, status, notes, leader_id, coordinator_id
    } = tripData;

    const [result] = await pool.query(
      `UPDATE vehicle_trips SET
        vehicle_id = ?, driver_id = ?, departure_location = ?, destination = ?,
        start_time = ?, end_time = ?, start_km = ?, end_km = ?,
        purpose = ?, status = ?, notes = ?, leader_id = ?, coordinator_id = ?
       WHERE id = ?`,
      [
        vehicle_id || null,
        driver_id || null,
        departure_location || oldData.departure_location,
        destination || oldData.destination,
        start_time || null,
        end_time || null,
        start_km || null,
        end_km || null,
        purpose || oldData.purpose,
        status || oldData.status,
        notes !== undefined ? notes : oldData.notes,
        leader_id || null,
        coordinator_id || null,
        id
      ]
    );

    if (userId) {
      await AuditLog.log(userId, 'UPDATE', 'vehicle_trips', id, oldData, tripData, `Cập nhật lịch trình di chuyển`);
    }

    return result.affectedRows;
  }

  static async delete(id, userId) {
    const oldData = await this.findById(id);
    if (!oldData) return 0;
    const [result] = await pool.query('DELETE FROM vehicle_trips WHERE id = ?', [id]);
    await AuditLog.log(userId, 'DELETE', 'vehicle_trips', id, oldData, null, `Xóa lịch trình di chuyển`);
    return result.affectedRows;
  }
}

export default VehicleTrip;