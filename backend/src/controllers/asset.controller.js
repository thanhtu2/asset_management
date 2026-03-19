import Asset from '../models/Asset.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import pool from '../config/database.js';

// Generate QR code for an asset
export const generateQR = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Logic để xác định URL của frontend cho mã QR
    // Ưu tiên:
    // 1. Query param `origin` (cho phép client tự chỉ định)
    // 2. Header `Origin` từ request (tự động phát hiện frontend đang gọi)
    // 3. Biến môi trường `FRONTEND_URL` làm phương án dự phòng
    let frontendUrl = req.query.origin || req.get('Origin') || process.env.FRONTEND_URL;

    if (!frontendUrl) {
      console.error("Lỗi generateQR: FRONTEND_URL chưa được cấu hình trong .env và không thể xác định từ request.");
      return res.status(500).json({ message: 'URL của Frontend chưa được cấu hình trên server.' });
    }

    // Dọn dẹp dấu gạch chéo thừa ở cuối URL
    frontendUrl = frontendUrl.replace(/\/$/, "");

    // Dữ liệu được mã hóa vào mã QR, sử dụng ID duy nhất của tài sản
    const qrData = `${frontendUrl}/asset/${asset.id}`;

    // Generate QR code as data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    res.json({
      asset_id: asset.id,
      asset_code: asset.asset_code,
      asset_name: asset.name,
      qr_code: qrCodeDataUrl
    });
  } catch (error) {
    console.error('generateQR error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    
    // Gắn thông tin user đang request để lọc dữ liệu
    if (req.user) {
      filters.currentUser = req.user;
    }

    console.log('getAll controller - page:', page, 'limit:', limit, 'filters:', filters);
    const result = await Asset.findAll(filters, page, limit);
    console.log('getAll controller - result:', result ? 'success' : 'null');
    res.json(result);
  } catch (error) {
    console.error('getAll controller error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllSimple = async (req, res) => {
  try {
    const assets = await Asset.findAllSimple(req.user);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getById = async (req, res, next) => {
  try {
    // The route is now protected by a regex `/:id(\\d+)`, so no need to check for string routes.
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getByCode = async (req, res) => {
  try {
    const asset = await Asset.findByCode(req.params.code);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getByBarcode = async (req, res) => {
  try {
    const asset = await Asset.findByBarcode(req.params.barcode);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const asset = await Asset.update(req.params.id, req.body);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const success = await Asset.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status, description } = req.body;
    const validStatuses = ['new', 'good', 'needs_repair', 'disposed'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const asset = await Asset.update(req.params.id, { status });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    let message = 'Cập nhật trạng thái thành công';
    let maintenanceCreated = false;

    // If status is "needs_repair", create a maintenance record
    if (status === 'needs_repair') {
      const desc = description || 'Cần sửa chữa (cập nhật bởi người dùng)';
      await MaintenanceRecord.create({
        asset_id: parseInt(req.params.id),
        maintenance_date: new Date(),
        maintenance_type: 'emergency',
        description: desc,
        cost: 0,
        technician: null,
        next_maintenance_date: null
      });
      message = 'Đã cập nhật trạng thái và tạo phiếu bảo trì';
      maintenanceCreated = true;
    }

    res.json({ message, asset, maintenanceCreated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reportDamage = async (req, res) => {
  try {
    const { description } = req.body;
    const assetId = req.params.id;

    // 1. Update asset status to "needs_repair"
    const asset = await Asset.update(assetId, { status: 'needs_repair' });
    if (!asset) {
      return res.status(404).json({ message: 'Tài sản không tồn tại' });
    }

    // 2. Create a maintenance record
    const desc = description || 'Báo cáo hư hỏng từ trang công khai';
    await MaintenanceRecord.create({
      asset_id: parseInt(assetId),
      maintenance_date: new Date(),
      maintenance_type: 'emergency',
      description: desc,
      cost: 0,
      technician: null,
      next_maintenance_date: null
    });

    res.json({
      message: 'Đã báo cáo hư hỏng và tạo phiếu bảo trì',
      asset,
      maintenanceCreated: true
    });
  } catch (error) {
    console.error('reportDamage error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await Asset.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download Excel template for asset import
export const downloadTemplate = (req, res) => {
  const headers = [
    'Mã tài sản', 'Tên tài sản', 'Mô tả',
    'Mã danh mục', 'Mã vị trí', 'Mã phòng ban', 'Mã nhà cung cấp',
    'Người sử dụng', 'Ngày mua (YYYY-MM-DD)', 'Giá mua', 'Giá trị hiện tại',
    'Trạng thái (new/good/needs_repair/disposed)', 'Mã vạch'
  ];
  const sample = [
    'TS001', 'Máy tính Dell', 'Máy tính để bàn',
    'COMPUTER', 'OFFICE1', 'IT', 'SUP001',
    'Nguyễn Văn B', '2024-01-15', '15000000', '12000000',
    'good', 'BC001'
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  ws['!cols'] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tài sản');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="template_import_tai_san.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};

// Import assets from uploaded Excel/CSV file
export const importAssets = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file được tải lên' });
    }

    // Parse workbook
    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    if (rows.length < 2) {
      return res.status(400).json({ message: 'File không có dữ liệu' });
    }

    // Pre-load lookup tables
    const [categories] = await pool.query('SELECT id, code FROM categories');
    const [locations]  = await pool.query('SELECT id, code FROM locations');
    const [departments]= await pool.query('SELECT id, code FROM departments');
    const [suppliers]  = await pool.query('SELECT id, code FROM suppliers');
    const [users]      = await pool.query('SELECT id, fullName, username FROM users');

    const catMap  = Object.fromEntries(categories.map(r => [r.code.toUpperCase(), r.id]));
    const locMap  = Object.fromEntries(locations.map(r => [r.code.toUpperCase(), r.id]));
    const deptMap = Object.fromEntries(departments.map(r => [r.code.toUpperCase(), r.id]));
    const supMap  = Object.fromEntries(suppliers.map(r => [r.code.toUpperCase(), r.id]));

    // Tạo object ánh xạ tên/username người dùng sang ID
    const userMap = {};
    users.forEach(u => {
      if (u.fullName) userMap[u.fullName.toLowerCase().trim()] = u.id;
      if (u.username) userMap[u.username.toLowerCase().trim()] = u.id;
    });

    const validStatuses = ['new', 'good', 'needs_repair', 'disposed'];
    const results = { success: 0, failed: 0, errors: [] };
    const dataRows = rows.slice(1); // skip header row

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // 1-indexed, skip header

      // Skip completely empty rows
      if (row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

      // Handle different column orders - check if "Mã nhà cung cấp" column exists
      // New format: Mã tài sản, Tên tài sản, Mô tả, Mã danh mục, Mã vị trí, Mã phòng ban, Mã nhà cung cấp, Người sử dụng, Ngày mua, Giá mua, Giá trị hiện tại, Trạng thái, Mã vạch
      const asset_code = row[0] ? String(row[0]).trim() : '';
      const name = row[1] ? String(row[1]).trim() : '';
      const description = row[2] ? String(row[2]).trim() : '';
      const category_code = row[3] ? String(row[3]).trim() : '';
      const location_code = row[4] ? String(row[4]).trim() : '';
      const department_code = row[5] ? String(row[5]).trim() : '';
      const supplier_code = row[6] ? String(row[6]).trim() : '';
      const assigned_to_name = row[7] ? String(row[7]).trim() : '';
      const purchase_date_raw = row[8];
      const purchase_price_raw = row[9] || 0;
      const current_value_raw = row[10] || purchase_price_raw;
      const status_raw = row[11] ? String(row[11]).trim() : '';
      const barcode = row[12] ? String(row[12]).trim() : '';

      // Validate required fields
      if (!asset_code) {
        results.failed++;
        results.errors.push({ row: rowNum, message: 'Thiếu mã tài sản' });
        continue;
      }
      if (!name) {
        results.failed++;
        results.errors.push({ row: rowNum, message: `Dòng ${rowNum}: Thiếu tên tài sản` });
        continue;
      }

      // Resolve IDs from codes
      const category_id  = category_code  ? (catMap[category_code.toUpperCase()]  || null) : null;
      const location_id  = location_code  ? (locMap[location_code.toUpperCase()]  || null) : null;
      const department_id= department_code? (deptMap[department_code.toUpperCase()]|| null) : null;
      const supplier_id  = supplier_code  ? (supMap[supplier_code.toUpperCase()]  || null) : null;
      const assigned_to  = assigned_to_name ? (userMap[assigned_to_name.toLowerCase().trim()] || null) : null;

      // Parse numeric fields
      const purchase_price  = parseFloat(purchase_price_raw)  || 0;
      const current_value   = parseFloat(current_value_raw)   || purchase_price;

      // Parse date (handle Excel serial numbers too)
      let purchase_date = null;
      if (purchase_date_raw) {
        if (purchase_date_raw instanceof Date) {
          purchase_date = purchase_date_raw.toISOString().slice(0, 10);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(purchase_date_raw)) {
          purchase_date = purchase_date_raw;
        } else {
          const d = new Date(purchase_date_raw);
          if (!isNaN(d.getTime())) purchase_date = d.toISOString().slice(0, 10);
        }
      }

      // Validate status
      const status = validStatuses.includes(status_raw) ? status_raw : 'new';

      try {
        await pool.query(
          `INSERT INTO assets (asset_code, name, description, category_id, location_id, department_id,
            supplier_id, purchase_date, purchase_price, current_value, status, barcode, assigned_to, assigned_to_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [asset_code, name, description || null, category_id, location_id, department_id,
           supplier_id, purchase_date, purchase_price, current_value, status, barcode || null, assigned_to, assigned_to_name || null]
        );
        results.success++;
      } catch (err) {
        results.failed++;
        const msg = err.code === 'ER_DUP_ENTRY'
          ? `Mã tài sản "${asset_code}" đã tồn tại`
          : err.message;
        results.errors.push({ row: rowNum, asset_code, message: msg });
      }
    }

    res.json({
      message: `Import hoàn tất: ${results.success} thành công, ${results.failed} thất bại`,
      ...results
    });
  } catch (error) {
    console.error('importAssets error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const exportAssets = async (req, res) => {
  try {
    const { page = 1, limit = 1000, ...filters } = req.query;
    
    // Gắn thông tin user đang request để lọc dữ liệu xuất Excel
    if (req.user) {
      filters.currentUser = req.user;
    }

    const result = await Asset.findAll(filters, page, limit);
    const assets = result.data || result;

    // Pre-load lookup tables for reverse mapping (name -> code)
    const [categories] = await pool.query('SELECT id, code, name FROM categories');
    const [locations]  = await pool.query('SELECT id, code, name FROM locations');
    const [departments]= await pool.query('SELECT id, code, name FROM departments');
    const [suppliers]  = await pool.query('SELECT id, code, name FROM suppliers');

    const catMap  = Object.fromEntries(categories.map(r => [r.id, r.code]));
    const locMap  = Object.fromEntries(locations.map(r => [r.id, r.code]));
    const deptMap = Object.fromEntries(departments.map(r => [r.id, r.code]));
    const supMap  = Object.fromEntries(suppliers.map(r => [r.id, r.code]));

    const data = assets.map(asset => ({
      'Mã tài sản': asset.asset_code,
      'Tên tài sản': asset.name,
      'Mô tả': asset.description || '',
      'Mã danh mục': catMap[asset.category_id] || '',
      'Mã vị trí': locMap[asset.location_id] || '',
      'Mã phòng ban': deptMap[asset.department_id] || '',
      'Mã nhà cung cấp': supMap[asset.supplier_id] || '',
      'Người sử dụng': asset.user_full_name || asset.assigned_to_name || '',
      'Ngày mua (YYYY-MM-DD)': asset.purchase_date ? new Date(asset.purchase_date).toISOString().slice(0, 10) : '',
      'Giá mua': asset.purchase_price || 0,
      'Giá trị hiện tại': asset.current_value || 0,
      'Trạng thái (new/good/needs_repair/disposed)': asset.status || 'new',
      'Mã vạch': asset.barcode || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
      { wch: 35 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tài sản');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="danh_sach_tai_san.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('exportAssets error:', error);
    res.status(500).json({ message: error.message });
  }
};
