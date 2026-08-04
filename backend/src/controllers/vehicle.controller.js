import pool from '../config/database.js';

export const getAllVehicles = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, plate_number, brand, model, vehicle_type, status, current_km 
      FROM vehicles 
      WHERE status != 'retired'
      ORDER BY plate_number ASC
    `);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};