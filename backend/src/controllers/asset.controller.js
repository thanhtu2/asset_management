import Asset from '../models/Asset.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import pool from '../config/database.js';
import { createNotification } from '../notification.service.js';
import AuditLog from '../models/AuditLog.js';

const calculateCurrentValue = (asset) => {
  if (!asset || !asset.purchase_price || !asset.purchase_date || !asset.depreciation_rate) {
    return asset?.current_value ?? asset?.purchase_price ?? 0;
  }

  const purchaseDate = new Date(asset.purchase_date);
  const now = new Date();
  
  let monthsPassed = (now.getFullYear() - purchaseDate.getFullYear()) * 12;
  monthsPassed -= purchaseDate.getMonth();
  monthsPassed += now.getMonth();  // ✅ FIXED!
  
  if (monthsPassed < 0) monthsPassed = 0;

  const annualDepreciationRate = asset.depreciation_rate / 100;
  const monthlyDepreciation = (asset.purchase_price * annualDepreciationRate) / 12;
  const totalDepreciation = monthlyDepreciation * monthsPassed;
  let calculatedValue = asset.purchase_price - totalDepreciation;
  
  const salvageValue = asset.salvage_value || 0;
  return Math.max(salvageValue, calculatedValue, 0);
};

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

    // Dynamically calculate current_value for each asset
    if (result && result.data && Array.isArray(result.data)) {
      result.data = result.data.map(asset => ({
        ...asset,
        current_value: calculateCurrentValue(asset)
      }));
    }

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

    // Dynamically calculate current_value for the single asset
    asset.current_value = calculateCurrentValue(asset);
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

    // Dynamically calculate current_value for the single asset
    asset.current_value = calculateCurrentValue(asset);
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

    // Dynamically calculate current_value for the single asset
    asset.current_value = calculateCurrentValue(asset);
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    
    // Thông báo có tài sản mới
    await createNotification(
      null, 
      'Tài sản mới', 
      `Tài sản "${req.body.name}" vừa được thêm vào hệ thống.`, 
      'success'
    );

    // Ghi log
    await AuditLog.log(req.user?.id, 'CREATE', 'ASSET', asset.id, null, req.body, `Thêm mới tài sản: ${req.body.name}`, req.ip);

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const oldAsset = await Asset.findById(req.params.id);
    const asset = await Asset.update(req.params.id, req.body);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    // Ghi log
    await AuditLog.log(req.user?.id, 'UPDATE', 'ASSET', req.params.id, oldAsset, req.body, `Cập nhật tài sản: ${req.body.name || req.params.id}`, req.ip);

    // Thông báo cập nhật thông tin
    await createNotification(
      null,
      'Cập nhật tài sản',
      `Tài sản "${req.body.name || 'ID: ' + req.params.id}" đã được chỉnh sửa thông tin.`,
      'info'
    );

    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const oldAsset = await Asset.findById(req.params.id);
    const success = await Asset.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    // Ghi log
    await AuditLog.log(req.user?.id, 'DELETE', 'ASSET', req.params.id, oldAsset, null, `Xóa tài sản: ${oldAsset?.name || req.params.id}`, req.ip);

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status, description } = req.body;
    const validStatuses = ['chờ cấp', 'đang sử dụng', 'cần sửa chữa', 'Hỏng', 'đã thanh lý'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const oldAsset = await Asset.findById(req.params.id);
    const asset = await Asset.update(req.params.id, { status });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    let message = 'Cập nhật trạng thái thành công';
    let maintenanceCreated = false;

    // If status is "needs_repair", create a maintenance record
    if (status === 'cần sửa chữa và hỏng') {
      const desc = description || 'Cần sửa chữa và hỏng (cập nhật bởi người dùng)';
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
    
    // Ghi log
    await AuditLog.log(req.user?.id, 'UPDATE', 'ASSET', req.params.id, { status: oldAsset?.status }, { status }, `Cập nhật trạng thái tài sản thành "${status}"`, req.ip);

    // Thông báo cập nhật trạng thái
    await createNotification(
      null, 
      'Thay đổi trạng thái', 
      `Tài sản ID: ${req.params.id} đã chuyển sang trạng thái: ${status}`, 
      status === 'cần sửa chữa và hỏng' ? 'warning' : 'info'
    );

    res.json({ message, asset, maintenanceCreated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reportDamage = async (req, res) => {
  try {
    const { description } = req.body;
    const assetId = req.params.id;

    // 1. Update asset status to "cần sửa chữa và hỏng"
    const asset = await Asset.update(assetId, { status: 'cần sửa chữa và hỏng' });
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
    
    // Ghi log (Khách từ Public quét mã QR báo hỏng, không có User ID)
    await AuditLog.log(null, 'UPDATE', 'ASSET', assetId, null, { status: 'cần sửa chữa và hỏng' }, `Khách báo hỏng tài sản từ mã QR: ${desc}`, req.ip);

    // Thông báo có thiết bị báo hỏng từ Public
    await createNotification(
      null,
      '⚠️ Báo hỏng thiết bị (Public)',
      `Tài sản ID: ${assetId} vừa được báo hỏng. Lý do: ${desc}`,
      'warning'
    );

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
    'Mã tài sản', 'Tên tài sản', 'Mô tả', 'Mã danh mục', 'Mã vị trí',
    'Mã phòng ban', 'Mã nhà cung cấp', 'Người sử dụng', 'Ngày mua (YYYY-MM-DD)',
    'Giá mua', 'Giá trị thu hồi', 'Giá trị hiện tại',
    'Trạng thái (chờ cấp/đang sử dụng/cần sửa chữa/hỏng/đã thanh lý)', 'Mã vạch'
  ];
  const sample = [
    'TS001', 'Máy tính Dell', 'Máy tính để bàn', 'COMPUTER', 'OFFICE1', 'IT',
    'SUP001', 'Nguyễn Văn B', '2024-01-15',
    '15000000', '500000', '12000000',
    'đang sử dụng', 'BC001'
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

    const validStatuses = ['chờ cấp', 'đang sử dụng', 'cần sửa chữa và hỏng', 'đã thanh lý'];
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
      const purchase_price_raw = row[9];
      const salvage_value_raw = row[10];
      const current_value_raw = row[11];
      const status_raw = row[12] ? String(row[12]).trim() : '';
      const barcode = row[13] ? String(row[13]).trim() : '';

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
      const purchase_price = parseFloat(purchase_price_raw) || 0;
      const salvage_value = parseFloat(salvage_value_raw) || 0;
      // If current_value is not provided, use purchase_price as a fallback
      const current_value = parseFloat(current_value_raw) || purchase_price;

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
      const status = validStatuses.includes(status_raw) ? status_raw : 'chờ cấp';

      try {
        await pool.query(
          `INSERT INTO assets (asset_code, name, description, category_id, location_id, department_id,
            supplier_id, purchase_date, purchase_price, salvage_value, current_value, status, barcode, assigned_to, assigned_to_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [asset_code, name, description || null, category_id, location_id, department_id,
           supplier_id, purchase_date, purchase_price, salvage_value, current_value, status, barcode || null, assigned_to, assigned_to_name || null]
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

    // Tạo thông báo tổng hợp hệ thống sau khi import xong
    if (results.success > 0) {
      await createNotification(
        null,
        'Import tài sản thành công',
        `Hệ thống vừa import thành công ${results.success} tài sản từ file Excel.${results.failed > 0 ? ` (Có ${results.failed} dòng bị lỗi/bỏ qua)` : ''}`,
        'success'
      );
      
      // Ghi log tác vụ Import
      await AuditLog.log(req.user?.id, 'CREATE', 'ASSET_IMPORT', null, null, null, `Import thành công ${results.success} tài sản từ Excel`, req.ip);
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
      'Giá trị thu hồi': asset.salvage_value || 0,
      'Giá trị hiện tại': asset.current_value || 0,
      'Trạng thái': asset.status || 'chờ cấp',
      'Mã vạch': asset.barcode || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
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
