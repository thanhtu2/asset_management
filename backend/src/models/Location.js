import pool from '../config/database.js';

const Location = {
  // Get all locations with pagination
  async findAll(page = 1, limit = 10) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM locations');
    const total = countResult[0].total;

    const [rows] = await pool.query(`
      SELECT l.*, p.name as parent_name 
      FROM locations l 
      LEFT JOIN locations p ON l.parent_id = p.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [limitNum, offset]);

    return {
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  },

  // Get all locations without pagination (for dropdowns)
  async findAllSimple() {
    const [rows] = await pool.query(`
      SELECT l.*, p.name as parent_name 
      FROM locations l 
      LEFT JOIN locations p ON l.parent_id = p.id
      ORDER BY l.name ASC
    `);
    return rows;
  },

  // Get location by ID
  async findById(id) {
    const [rows] = await pool.query(`
      SELECT l.*, p.name as parent_name 
      FROM locations l 
      LEFT JOIN locations p ON l.parent_id = p.id
      WHERE l.id = ?
    `, [id]);
    return rows[0];
  },

  // Get location by code
  async findByCode(code) {
    const [rows] = await pool.query('SELECT * FROM locations WHERE code = ?', [code]);
    return rows[0];
  },

  // Create new location
  async create(locationData) {
    const { name, code, address, parent_id } = locationData;
    
    const [result] = await pool.query(
      'INSERT INTO locations (name, code, address, parent_id) VALUES (?, ?, ?, ?)',
      [name, code, address || null, parent_id || null]
    );
    return this.findById(result.insertId);
  },

  // Update location
  async update(id, locationData) {
    const { name, code, address, parent_id } = locationData;
    
    await pool.query(
      'UPDATE locations SET name = ?, code = ?, address = ?, parent_id = ? WHERE id = ?',
      [name, code, address || null, parent_id || null, id]
    );
    return this.findById(id);
  },

  // Delete location
  async delete(id) {
    const [result] = await pool.query('DELETE FROM locations WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

export default Location;
