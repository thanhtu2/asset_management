import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = {
  // Get all users
  async findAll() {
    const [rows] = await pool.query(`
      SELECT u.*, d.name as department_name 
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `);
    return rows;
  },
  async findAllSimple() {
    const [rows] = await pool.query(`
      SELECT id, username, fullName 
      FROM users 
      WHERE isActive = true 
      ORDER BY fullName ASC
    `);
    return rows;
  },

  // Get user by ID
  async findById(id) {
    const [rows] = await pool.query(`
      SELECT u.*, d.name as department_name 
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [id]);
    return rows[0];
  },

  // Get user by username
  async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  },

  // Create new user
  async create(userData) {
    const { username, password, fullName, role, department_id } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      'INSERT INTO users (username, password, fullName, role, department_id) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, fullName, role || 'user', department_id || null]
    );
    return this.findById(result.insertId);
  },

  // Update user
  async update(id, userData) {
    const { fullName, role, department_id, isActive, password } = userData;
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET fullName = ?, role = ?, department_id = ?, isActive = ?, password = ? WHERE id = ?',
        [fullName, role, department_id, isActive, hashedPassword, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET fullName = ?, role = ?, department_id = ?, isActive = ? WHERE id = ?',
        [fullName, role, department_id, isActive, id]
      );
    }
    return this.findById(id);
  },

  // Delete user
  async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
};

export default User;
