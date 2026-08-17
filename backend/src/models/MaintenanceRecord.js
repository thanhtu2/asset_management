import pool from '../config/database.js';
import { buildPaginationQuery, getPagination } from '../ultis/pagination.js';

const MaintenanceRecord = {
  // Get all maintenance records
  // async findAll(filters = {}, page = 1, limit = 10) {
  //   let query = `
  //     SELECT m.*, a.asset_code, a.name as asset_name
  //     FROM maintenance_records m
  //     LEFT JOIN assets a ON m.asset_id = a.id
  //     WHERE 1=1
  //   `;
  //   const params = [];

  //   if (filters.asset_id) {
  //     query += ' AND m.asset_id = ?';
  //     params.push(filters.asset_id);
  //   }

  //   const { paginatedQuery, countQuery, limitNum, offset } = buildPaginationQuery(query, page, limit, 'm.maintenance_date DESC');

  //   const [rows] = await pool.query(paginatedQuery, [...params, limitNum, offset]);
  //   const [totalRes] = await pool.query(countQuery, params);
  //   const total = totalRes[0].count;
  //   const pagination = getPagination(page, limit, total);

  //   return { data: rows, pagination };
  // },

  // Get all maintenance records
  async findAll(filters = {}, page = 1, limit = 10) {
    let baseQuery = `
      FROM maintenance_records m
      LEFT JOIN assets a ON m.asset_id = a.id
      WHERE 1=1
    `;
    const params = [];

    // Chỉ filter khi asset_id có giá trị thực sự
    if (filters.asset_id && filters.asset_id !== '') {
      baseQuery += ' AND m.asset_id = ?';
      params.push(filters.asset_id);
    }

    // 1. Đếm tổng số bản ghi
    const countSql = `SELECT COUNT(*) as total ${baseQuery}`;
    const [totalRes] = await pool.query(countSql, params);
    const total = totalRes[0]?.total || 0;

    // 2. Lấy dữ liệu phân trang
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const offset = (pageNum - 1) * limitNum;

    const dataSql = `
      SELECT m.*, a.asset_code, a.name as asset_name
      ${baseQuery}
      ORDER BY m.maintenance_date DESC
      LIMIT ? OFFSET ?
    `;

    // Ép kiểu Number cho limit và offset để tránh lỗi MySQL Prepared Statement
    const [rows] = await pool.query(dataSql, [...params, Number(limitNum), Number(offset)]);
    
    const totalPages = Math.ceil(total / limitNum) || 1;

    return { 
      data: rows || [], 
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      } 
    };
  },

  // Get maintenance record by ID
  async findById(id) {
    const [rows] = await pool.query(`
      SELECT m.*, a.asset_code, a.name as asset_name
      FROM maintenance_records m
      LEFT JOIN assets a ON m.asset_id = a.id
      WHERE m.id = ?
    `, [id]);
    return rows[0];
  },

  // Create maintenance record
  async create(data) {
    const { asset_id, maintenance_date, maintenance_type, description, cost, technician, next_maintenance_date } = data;
    
    const [result] = await pool.query(
      'INSERT INTO maintenance_records (asset_id, maintenance_date, maintenance_type, description, cost, technician, next_maintenance_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [asset_id, maintenance_date, maintenance_type, description, cost, technician, next_maintenance_date]
    );
    return this.findById(result.insertId);
  },

  // Update maintenance record
  async update(id, data) {
    // Get existing record
    const existing = await this.findById(id);
    if (!existing) return null;

    const { 
      asset_id = existing.asset_id, 
      maintenance_date = existing.maintenance_date, 
      maintenance_type = existing.maintenance_type, 
      description = existing.description, 
      cost = existing.cost, 
      technician = existing.technician, 
      next_maintenance_date = existing.next_maintenance_date,
      status = existing.status,
      completion_date = existing.completion_date
    } = data;
    
    await pool.query(
      'UPDATE maintenance_records SET asset_id=?, maintenance_date=?, maintenance_type=?, description=?, cost=?, technician=?, next_maintenance_date=?, status=?, completion_date=? WHERE id=?',
      [asset_id, maintenance_date, maintenance_type, description, cost, technician, next_maintenance_date, status, completion_date, id]
    );
    return this.findById(id);
  },

  // Delete maintenance record
  async delete(id) {
    const [result] = await pool.query('DELETE FROM maintenance_records WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Get upcoming maintenance
  async getUpcoming() {
    const [rows] = await pool.query(`
      SELECT m.*, a.asset_code, a.name as asset_name
      FROM maintenance_records m
      LEFT JOIN assets a ON m.asset_id = a.id
      WHERE m.next_maintenance_date IS NOT NULL
        AND m.next_maintenance_date >= CURDATE()
      ORDER BY m.next_maintenance_date ASC
      LIMIT 10
    `);
    return rows;
  },

  // Get maintenance costs by period
  async getCosts(filters = {}) {
    let query = `
      SELECT SUM(cost) as total_cost, COUNT(*) as total_records
      FROM maintenance_records
      WHERE 1=1
    `;
    const params = [];

    if (filters.year) {
      query += ' AND YEAR(maintenance_date) = ?';
      params.push(filters.year);
    }

    const [rows] = await pool.query(query, params);
    return rows[0];
  }
};

export default MaintenanceRecord;
