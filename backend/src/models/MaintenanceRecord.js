import pool from '../config/database.js';

const MaintenanceRecord = {
  // Get all maintenance records
  async findAll(filters = {}) {
    let query = `
      SELECT m.*, a.asset_code, a.name as asset_name
      FROM maintenance_records m
      LEFT JOIN assets a ON m.asset_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.asset_id) {
      query += ' AND m.asset_id = ?';
      params.push(filters.asset_id);
    }

    query += ' ORDER BY m.maintenance_date DESC';

    const [rows] = await pool.query(query, params);
    return rows;
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
    const { asset_id, maintenance_date, maintenance_type, description, cost, technician, next_maintenance_date } = data;
    
    await pool.query(
      'UPDATE maintenance_records SET asset_id=?, maintenance_date=?, maintenance_type=?, description=?, cost=?, technician=?, next_maintenance_date=? WHERE id=?',
      [asset_id, maintenance_date, maintenance_type, description, cost, technician, next_maintenance_date, id]
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
