import pool from '../config/database.js';

export const getAllPermissions = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT code, name, module FROM permissions ORDER BY module ASC, name ASC');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPermission = async (req, res) => {
  try {
    const { code, name, module } = req.body;
    if (!code || !name) {
      return res.status(400).json({ message: 'Mã và tên quyền là bắt buộc' });
    }
    
    await pool.query(
      'INSERT INTO permissions (code, name, module) VALUES (?, ?, ?)',
      [code.toUpperCase().trim(), name, module || 'Hệ thống']
    );
    
    res.status(201).json({ message: 'Thêm quyền mới thành công' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Mã quyền này đã tồn tại trong hệ thống' });
    }
    res.status(500).json({ message: error.message });
  }
};