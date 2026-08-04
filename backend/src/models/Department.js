import pool from '../config/database.js';

const Department = {
  // Get all departments with pagination
  async findAll(page = 1, limit = 10) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM departments');
    const total = countResult[0].total;

    const [rows] = await pool.query(`
      SELECT d.*, 
             p.name as parent_name,
             m.fullName as manager_name
      FROM departments d 
      LEFT JOIN departments p ON d.parent_id = p.id
      LEFT JOIN users m ON d.manager_id = m.id
      ORDER BY d.created_at DESC
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

  // Get department by ID
  async findById(id) {
    const [rows] = await pool.query(`
      SELECT d.*, 
             p.name as parent_name,
             m.fullName as manager_name
      FROM departments d 
      LEFT JOIN departments p ON d.parent_id = p.id
      LEFT JOIN users m ON d.manager_id = m.id
      WHERE d.id = ?
    `, [id]);
    return rows[0];
  },

  // Get department by code
  async findByCode(code) {
    const [rows] = await pool.query('SELECT * FROM departments WHERE code = ?', [code]);
    return rows[0];
  },

  // Create new department
  async create(departmentData) {
    const { name, code, manager_id, parent_id } = departmentData;
    
    const [result] = await pool.query(
      'INSERT INTO departments (name, code, manager_id, parent_id) VALUES (?, ?, ?, ?)',
      [name, code, manager_id || null, parent_id || null]
    );
    return this.findById(result.insertId);
  },

  // Update department
  async update(id, departmentData) {
    const { name, code, manager_id, parent_id } = departmentData;
    
    await pool.query(
      'UPDATE departments SET name = ?, code = ?, manager_id = ?, parent_id = ? WHERE id = ?',
      [name, code, manager_id || null, parent_id || null, id]
    );
    return this.findById(id);
  },

  // Delete department
  async delete(id) {
    const [result] = await pool.query('DELETE FROM departments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Get all departments without pagination (for dropdowns)
  async findAllSimple() {
    const [rows] = await pool.query(`
      SELECT d.id, d.name, d.code
      FROM departments d
      ORDER BY d.name ASC
    `);
    return rows;
  }
};

export default Department;
