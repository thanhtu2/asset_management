import User from '../models/User.js';
import * as XLSX from 'xlsx';
import AuditLog from '../models/AuditLog.js';

export const getAll = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAllSimple = async (req, res) => {
  try {
    const users = await User.findAllSimple();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const user = await User.create(req.body);
    await AuditLog.log(req.user?.id, 'CREATE', 'USER', user.id, null, req.body, `Tạo người dùng mới: ${req.body.username}`, req.ip);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const user = await User.update(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await AuditLog.log(req.user?.id, 'UPDATE', 'USER', req.params.id, null, req.body, `Cập nhật người dùng: ${req.body.username || req.params.id}`, req.ip);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const success = await User.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }
    await AuditLog.log(req.user?.id, 'DELETE', 'USER', req.params.id, null, null, `Xóa người dùng ID: ${req.params.id}`, req.ip);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    
    const data = users.map(user => ({
      'Tên đăng nhập': user.username,
      'Họ tên': user.fullName,
      'Vai trò': user.role === 'admin' ? 'Quản trị viên' : 'Người dùng',
      'Bộ phận': user.department_name || '-',
      'Trạng thái': user.isActive ? 'Hoạt động' : 'Khóa',
      'Ngày tạo': user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Người dùng');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="danh_sach_nguoi_dung.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
