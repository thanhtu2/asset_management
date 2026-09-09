import pool from '../config/database.js';
import AuditLog from '../models/AuditLog.js';

export const getAllVehicles = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, plate_number, brand, model, vehicle_type, status, current_km, is_external, vendor_name, vendor_contact
      FROM vehicles 
      WHERE status != 'retired'
      ORDER BY is_external ASC, plate_number ASC
    `);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// hàm tạo xe thuê ngoài
export const createExternalVehicle = async (req, res) => {
  try {
    const { plate_number, vendor_name, vendor_contact, vehicle_type, brand, model} = req.body;

    if (!plate_number || !plate_number.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập biển số xe thuê.' });
    }
    if (!vendor_name || !vendor_name.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập tên nhà xe cho thuê.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM vehicles WHERE plate_number = ? LIMIT 1',
      [plate_number.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Biển số này đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.' });
    }

    const [result] = await pool.query(
      `INSERT INTO vehicles (plate_number, is_external, vendor_name, vendor_contact, status, vehicle_type, brand, model)
       VALUES (?, 1, ?, ?, 'available', ?, ?, ?)`,
      [plate_number.trim(), vendor_name.trim(), vendor_contact?.trim() || null, vehicle_type?.trim() || null, brand?.trim() || null, model?.trim() || null]
    );

    await AuditLog.log(
      req.user.id, 'CREATE', 'vehicles', result.insertId,
      null,
      { plate_number: plate_number.trim(), vendor_name: vendor_name.trim(), is_external: true },
      `Thêm xe thuê ngoài: ${plate_number.trim()} (${vendor_name.trim()})`
    );

    res.status(201).json({ message: 'Thêm xe thuê ngoài thành công', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};