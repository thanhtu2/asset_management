import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'asset_management_secret_key_2024';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValid = await User.verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is locked' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, department_id: user.department_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Lấy danh sách quyền của Role từ database
    const [perms] = await pool.query('SELECT permission_code FROM role_permissions WHERE role_code = ?', [user.role]);
    
    const { password: _, ...userData } = user;
    userData.permissions = perms.map(p => p.permission_code);
    
    res.json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { username, password, fullName, role, department_id } = req.body;
    
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const user = await User.create({ username, password, fullName, role, department_id });
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const { password: _, ...userData } = user;
    
    res.status(201).json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Lấy danh sách quyền của Role từ database
    const [perms] = await pool.query('SELECT permission_code FROM role_permissions WHERE role_code = ?', [user.role]);

    const { password: _, ...userData } = user;
    userData.permissions = perms.map(p => p.permission_code);
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updatedUserData = {
      fullName: fullName || user.fullName,
      role: user.role,
      department_id: user.department_id,
      isActive: user.isActive
    };
    
    const updatedUser = await User.update(req.user.id, updatedUserData);
    
    const [perms] = await pool.query('SELECT permission_code FROM role_permissions WHERE role_code = ?', [updatedUser.role]);
    
    const { password: _, ...userData } = updatedUser;
    userData.permissions = perms.map(p => p.permission_code);
    
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // 1. Kiểm tra đầu vào
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    const isValid = await User.verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }
    
    // Truyền đầy đủ các trường hiện tại để tránh lỗi null các cột bắt buộc
    await User.update(req.user.id, { 
      fullName: user.fullName,
      role: user.role,
      department_id: user.department_id,
      isActive: user.isActive,
      password: newPassword 
    });
    
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
