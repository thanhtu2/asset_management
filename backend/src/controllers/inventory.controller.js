import InventorySession from '../models/InventorySession.js';
import pool from '../config/database.js';
import * as XLSX from 'xlsx';

// Helper chuyển đổi trạng thái tài sản sang Tiếng Việt
const getAssetStatusLabel = (status) => {
  const labels = {
    'new': 'Chờ cấp',
    'good': 'Đang sử dụng',
    'needs_repair': 'Cần sửa chữa',
    'damaged': 'Hỏng',
    'disposed': 'Đã thanh lý'
  };
  return labels[status] || status;
};


// Helper chuyển đổi trạng thái phiên sang Tiếng Việt
const getSessionStatusLabel = (status) => {
  const labels = {
    'draft': 'Nháp',
    'in_progress': 'Đang kiểm kê',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  };
  return labels[status] || status;
};

// Helper chuyển đổi trạng thái bản ghi sang Tiếng Việt
const getRecordStatusLabel = (status) => {
  const labels = {
    'pending_check': 'Chờ kiểm',
    'found': 'Tìm thấy',
    'missing': 'Thiếu',
    'damaged': 'Hỏng',
    'extra': 'Thừa',
    'found_wrong_location': 'Sai vị trí'
  };
  return labels[status] || status;
};

export const getAll = async (req, res) => {
  try {
    const sessions = await InventorySession.findAll();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportInventoryReport = async (req, res) => {
  try {
    const sessionId = req.params.id;

    // 1. Lấy thông tin phiên
    const [sessionRows] = await pool.query(`
      SELECT s.*, d.name as department_name, u.fullName as created_by_name
      FROM inventory_sessions s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [sessionId]);
    const session = sessionRows[0];

    if (!session) {
      return res.status(404).json({ message: 'Phiên kiểm kê không tìm thấy' });
    }

    // 2. Lấy chi tiết tất cả tài sản trong phiên
    const [records] = await pool.query(`
      SELECT ir.*, a.asset_code, a.name as asset_name, a.description as asset_description,
        a.purchase_date, a.purchase_price, a.current_value, a.status as asset_current_status,
        cat.name as category_name, loc.name as location_name, dept.name as department_name,
        u.fullName as assigned_to_name, actual_loc.name as actual_location_name,
        checked_by_user.fullName as checked_by_name
      FROM inventory_records ir
      JOIN assets a ON ir.asset_id = a.id
      LEFT JOIN categories cat ON a.category_id = cat.id
      LEFT JOIN locations loc ON a.location_id = loc.id
      LEFT JOIN departments dept ON a.department_id = dept.id
      LEFT JOIN users u ON a.assigned_to = u.id
      LEFT JOIN locations actual_loc ON ir.actual_location_id = actual_loc.id
      LEFT JOIN users checked_by_user ON ir.checked_by = checked_by_user.id
      WHERE ir.session_id = ?
      ORDER BY dept.name, a.asset_code
    `, [sessionId]);

    // 3. Lấy tổng hợp theo từng phòng ban
    const [summaryByDept] = await pool.query(`
      SELECT d.name as department_name, COUNT(ir.id) as total,
        SUM(CASE WHEN ir.status = 'pending_check' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN ir.status = 'found' THEN 1 ELSE 0 END) as found_count,
        SUM(CASE WHEN ir.status = 'missing' THEN 1 ELSE 0 END) as missing_count,
        SUM(CASE WHEN ir.status = 'damaged' THEN 1 ELSE 0 END) as damaged_count,
        SUM(CASE WHEN ir.status = 'extra' THEN 1 ELSE 0 END) as extra_count,
        SUM(CASE WHEN ir.status = 'found_wrong_location' THEN 1 ELSE 0 END) as found_wrong_location_count
      FROM inventory_records ir
      JOIN assets a ON ir.asset_id = a.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE ir.session_id = ?
      GROUP BY d.name ORDER BY d.name
    `, [sessionId]);

    const wb = XLSX.utils.book_new();

    // --- Sheet 1: Tổng hợp chung ---
    const sessionInfoData = [
      ['BÁO CÁO KIỂM KÊ TÀI SẢN'],
      [`Phiên kiểm kê: ${session.name}`],
      [`Mã phiên: ${session.id}`],
      [`Ngày bắt đầu: ${session.start_date ? new Date(session.start_date).toLocaleDateString('vi-VN') : '-'}`],
      [`Ngày kết thúc: ${session.end_date ? new Date(session.end_date).toLocaleDateString('vi-VN') : '-'}`],
      [`Trạng thái: ${getSessionStatusLabel(session.status)}`],
      [`Phòng ban kiểm kê: ${session.department_name || 'Tất cả'}`],
      [`Người tạo: ${session.created_by_name || '-'}`],
      [],
      ['TỔNG HỢP KẾT QUẢ'],
    ];

    const overallSummary = {
      total: records.length,
      pending_check: records.filter(r => r.status === 'pending_check').length,
      found: records.filter(r => r.status === 'found').length,
      missing: records.filter(r => r.status === 'missing').length,
      damaged: records.filter(r => r.status === 'damaged').length,
      extra: records.filter(r => r.status === 'extra').length,
      found_wrong_location: records.filter(r => r.status === 'found_wrong_location').length,
    };

    sessionInfoData.push(
      ['Tổng số tài sản:', overallSummary.total],
      ['Chờ kiểm:', overallSummary.pending_check],
      ['Tìm thấy:', overallSummary.found],
      ['Thiếu:', overallSummary.missing],
      ['Hỏng:', overallSummary.damaged],
      ['Thừa:', overallSummary.extra],
      ['Sai vị trí:', overallSummary.found_wrong_location]
    );

    const ws1 = XLSX.utils.aoa_to_sheet(sessionInfoData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng hợp');

    // --- Sheet 2: Theo phòng ban ---
    if (summaryByDept.length > 0) {
      const summaryHeaders = ['Phòng ban', 'Tổng', 'Chờ kiểm', 'Tìm thấy', 'Thiếu', 'Hỏng', 'Thừa', 'Sai vị trí'];
      const summaryData = summaryByDept.map(s => [
        s.department_name || 'Chưa phân phòng', s.total, s.pending_count, s.found_count, 
        s.missing_count, s.damaged_count, s.extra_count, s.found_wrong_location_count
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryData]);
      XLSX.utils.book_append_sheet(wb, ws2, 'Tổng hợp theo phòng');
    }

    // --- Sheet 3: Chi tiết bản ghi ---
    if (records.length > 0) {
      const recordHeaders = [
        'Mã bản ghi', 'Mã tài sản', 'Tên tài sản', 'Mô tả', 'Danh mục', 'Vị trí gốc', 'Phòng ban gốc',
        'Người sử dụng', 'Ngày mua', 'Giá mua', 'Giá trị hiện tại', 'Trạng thái gốc',
        'Kết quả kiểm kê', 'Vị trí thực tế', 'Người kiểm', 'Thời gian', 'Ghi chú'
      ];
      const recordData = records.map(r => [
        r.id, r.asset_code, r.asset_name, r.asset_description, r.category_name, r.location_name, r.department_name,
        r.assigned_to_name, r.purchase_date ? new Date(r.purchase_date).toLocaleDateString('vi-VN') : '-',
        r.purchase_price, r.current_value, getAssetStatusLabel(r.asset_current_status), getRecordStatusLabel(r.status),
        r.actual_location_name || '-', r.checked_by_name || '-', r.checked_at ? new Date(r.checked_at).toLocaleString('vi-VN') : '-', r.notes || '-'
      ]);
      const ws3 = XLSX.utils.aoa_to_sheet([recordHeaders, ...recordData]);
      XLSX.utils.book_append_sheet(wb, ws3, 'Chi tiết bản ghi');
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="bao_cao_kiem_ke_${session.id}_${session.created_at}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const session = await InventorySession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Inventory session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const session = await InventorySession.create(req.body, req.user.id);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const session = await InventorySession.update(req.params.id, req.body);
    if (!session) {
      return res.status(404).json({ message: 'Inventory session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const success = await InventorySession.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Inventory session not found' });
    }
    res.json({ message: 'Inventory session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addAssets = async (req, res) => {
  try {
    const { assetIds } = req.body;
    await InventorySession.addAssets(req.params.id, assetIds);
    res.json({ message: 'Assets added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecords = async (req, res) => {
  try {
    const records = await InventorySession.getRecords(req.params.id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRecord = async (req, res) => {
  try {
    await InventorySession.updateRecord(req.params.id, req.params.recordId, {
      ...req.body,
      checked_by: req.user.id
    });
    res.json({ message: 'Record updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSummary = async (req, res) => {
  try {
    const summary = await InventorySession.getSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const complete = async (req, res) => {
  try {
    const session = await InventorySession.complete(req.params.id);
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addAssetsByDepartment = async (req, res) => {
  try {
    const { department_id } = req.body;
    if (!department_id) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    const result = await InventorySession.addAssetsByDepartment(req.params.id, department_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addAllAssets = async (req, res) => {
  try {
    const result = await InventorySession.addAllAssets(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecordsWithDepartment = async (req, res) => {
  try {
    const records = await InventorySession.getRecordsWithDepartment(req.params.id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSummaryByDepartment = async (req, res) => {
  try {
    const summary = await InventorySession.getSummaryByDepartment(req.params.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const scanAsset = async (req, res) => {
  try {
    const result = await InventorySession.handleScan(req.params.id, req.body, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
