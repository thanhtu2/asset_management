import User from '../models/User.js';
import * as XLSX from 'xlsx';
import AuditLog from '../models/AuditLog.js';
import pool from '../config/database.js';
import { createNotification } from '../notification.service.js';

export const getAll = async (req, res) => {
  try {
    const { search, role } = req.query;
    const filters = {};
    if (search) {
      filters.search = search;
    }
    if (role) {
      filters.role = role;
    }
    const users = await User.findAll(filters);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const importUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file được tải lên' });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    if (rows.length < 2) {
      return res.status(400).json({ message: 'File không có dữ liệu' });
    }

    // Pre-load lookup tables
    const [departments] = await pool.query('SELECT id, code FROM departments');
    const [roles] = await pool.query('SELECT code FROM roles');

    const deptMap = Object.fromEntries(departments.map(r => [r.code.toUpperCase(), r.id]));
    const roleSet = new Set(roles.map(r => r.code));

    const results = { success: 0, failed: 0, errors: [] };
    const dataRows = rows.slice(1);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2;

      if (row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

      const username = String(row[0] || '').trim();
      const password = String(row[1] || '').trim();
      const fullName = String(row[2] || '').trim();
      const role_code = String(row[3] || 'user').trim();
      const department_code = String(row[4] || '').trim();

      if (!username || !password || !fullName) {
        results.failed++;
        results.errors.push({ row: rowNum, username, message: 'Thiếu thông tin bắt buộc (username, password, fullName)' });
        continue;
      }

      if (!roleSet.has(role_code)) {
        results.failed++;
        results.errors.push({ row: rowNum, username, message: `Mã vai trò '${role_code}' không hợp lệ` });
        continue;
      }

      const department_id = department_code ? (deptMap[department_code.toUpperCase()] || null) : null;
      if (department_code && !department_id) {
        results.failed++;
        results.errors.push({ row: rowNum, username, message: `Mã phòng ban '${department_code}' không tồn tại` });
        continue;
      }

      try {
        const userData = {
          username,
          password,
          fullName,
          role: role_code,
          department_id,
          isActive: true
        };
        await User.create(userData, connection); // Pass connection for transaction
        results.success++;
      } catch (err) {
        results.failed++;
        const msg = err.code === 'ER_DUP_ENTRY'
          ? `Tên đăng nhập "${username}" đã tồn tại`
          : err.message;
        results.errors.push({ row: rowNum, username, message: msg });
      }
    }

    if (results.failed > 0) {
      await connection.rollback();
    } else {
      await connection.commit();
    }
    connection.release();

    if (results.success > 0) {
      await createNotification(
        null,
        'Import người dùng thành công',
        `Hệ thống vừa import thành công ${results.success} người dùng từ file Excel.`,
        'success'
      );
      await AuditLog.log(req.user?.id, 'CREATE', 'USER_IMPORT', null, null, null, `Import thành công ${results.success} người dùng từ Excel`, req.ip);
    }

    res.json({
      message: `Import hoàn tất: ${results.success} thành công, ${results.failed} thất bại.`,
      ...results
    });

  } catch (error) {
    console.error('importUsers error:', error);
    res.status(500).json({
      message: error.message,
      success: 0,
      failed: 0,
      errors: []
    });
  }
};

export const downloadImportTemplate = (req, res) => {
  const headers = [
    'username', 'password', 'fullName', 'role', 'department_code'
  ];
  const sample = [
    'nguyenvana', 'password123', 'Nguyễn Văn A', 'user', 'KD'
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Người dùng');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="template_import_nguoi_dung.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
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

export const getAllSimple = async (req, res) => {
  try {
    const users = await User.findAllSimple();
    res.json(users);
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
