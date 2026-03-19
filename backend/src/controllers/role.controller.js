import pool from '../config/database.js';

export const getAllRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT code, name, description FROM roles ORDER BY name ASC');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRole = async (req, res) => {
  try {
    const { code, name, description } = req.body;
    if (!code || !name) {
      return res.status(400).json({ message: 'Mã và tên vai trò là bắt buộc' });
    }
    await pool.query(
      'INSERT INTO roles (code, name, description) VALUES (?, ?, ?)',
      [code.toLowerCase().trim(), name, description || '']
    );
    res.status(201).json({ message: 'Thêm vai trò mới thành công' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Mã vai trò này đã tồn tại trong hệ thống' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getRolePermissions = async (req, res) => {
  try {
    const { roleCode } = req.params;
    const [rows] = await pool.query('SELECT permission_code FROM role_permissions WHERE role_code = ?', [roleCode]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRolePermissions = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { roleCode } = req.params;
    const { permissions } = req.body; // Mảng các permission_code (VD: ['VIEW_ASSETS', 'DELETE_USER'])

    await connection.beginTransaction();
    // 1. Xóa toàn bộ quyền cũ của vai trò này
    await connection.query('DELETE FROM role_permissions WHERE role_code = ?', [roleCode]);
    
    // 2. Thêm lại các quyền mới (nếu có)
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const values = permissions.map(p => [roleCode, p]);
      await connection.query('INSERT INTO role_permissions (role_code, permission_code) VALUES ?', [values]);
    }

    await connection.commit();
    res.json({ message: 'Cập nhật phân quyền thành công' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};