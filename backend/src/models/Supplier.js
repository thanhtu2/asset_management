import pool from '../config/database.js';

const Supplier = {
  // Get all suppliers with pagination
  async findAll(page = 1, limit = 10) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM suppliers');
    const total = countResult[0].total;

    const [rows] = await pool.query(
      'SELECT * FROM suppliers ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limitNum, offset]
    );

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

  // Get supplier by ID
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    return rows[0];
  },

  // Get supplier by code
  async findByCode(code) {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE code = ?', [code]);
    return rows[0];
  },

  // Create new supplier
  async create(supplierData) {
    const { name, code, contact_person, phone, email, address } = supplierData;
    
    const [result] = await pool.query(
      'INSERT INTO suppliers (name, code, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)',
      [name, code, contact_person || null, phone || null, email || null, address || null]
    );
    return this.findById(result.insertId);
  },

  // Update supplier
  async update(id, supplierData) {
    const { name, code, contact_person, phone, email, address } = supplierData;
    
    await pool.query(
      'UPDATE suppliers SET name = ?, code = ?, contact_person = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [name, code, contact_person || null, phone || null, email || null, address || null, id]
    );
    return this.findById(id);
  },

  // Delete supplier
  async delete(id) {
    const [result] = await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

export default Supplier;
