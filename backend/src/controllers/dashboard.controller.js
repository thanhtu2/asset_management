import pool from '../config/database.js';

export const getStats = async (req, res) => {
  try {
    // Total assets
    const [totalAssets] = await pool.query('SELECT COUNT(*) as count FROM assets');
    
    // Assets by status
    const [assetsByStatus] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM assets 
      GROUP BY status
    `);
    
    // Calculate assets by specific conditions
    // New assets (created this month)
    const [newAssets] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM assets 
      WHERE MONTH(created_at) = MONTH(CURDATE()) 
        AND YEAR(created_at) = YEAR(CURDATE())
    `);
    
    // Good assets (status = 'good')
    const [goodAssets] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM assets 
      WHERE status = 'good'
    `);
    
    // Needs repair assets
    const [needsRepairAssets] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM assets 
      WHERE status = 'needs_repair'
    `);
    
    // Disposed assets
    const [disposedAssets] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM assets 
      WHERE status = 'disposed'
    `);
    
    // Assets by category
    const [assetsByCategory] = await pool.query(`
      SELECT c.name, COUNT(a.id) as count 
      FROM categories c 
      LEFT JOIN assets a ON c.id = a.category_id 
      GROUP BY c.id, c.name
    `);
    
    // Assets by department
    const [assetsByDepartment] = await pool.query(`
      SELECT d.name, COUNT(a.id) as count 
      FROM departments d 
      LEFT JOIN assets a ON d.id = a.department_id 
      GROUP BY d.id, d.name
    `);
    
    // Assets by location
    const [byLocation] = await pool.query(`
      SELECT l.name, COUNT(a.id) as count 
      FROM locations l 
      LEFT JOIN assets a ON l.id = a.location_id 
      GROUP BY l.id, l.name
    `);
    
    // Total value
    const [totalValue] = await pool.query(`
      SELECT 
        SUM(purchase_price) as total_purchase,
        SUM(current_value) as total_current
      FROM assets
    `);
    
    // Recent assets
    const [recentAssets] = await pool.query(`
      SELECT * FROM assets 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    // Upcoming maintenance
    const [upcomingMaintenance] = await pool.query(`
      SELECT m.*, a.asset_code, a.name as asset_name
      FROM maintenance_records m
      LEFT JOIN assets a ON m.asset_id = a.id
      WHERE m.next_maintenance_date IS NOT NULL
        AND m.next_maintenance_date >= CURDATE()
      ORDER BY m.next_maintenance_date ASC
      LIMIT 5
    `);
    
    // Maintenance costs this year
    const [maintenanceCosts] = await pool.query(`
      SELECT SUM(cost) as total_cost, COUNT(*) as total_records
      FROM maintenance_records
      WHERE YEAR(maintenance_date) = YEAR(CURDATE())
    `);
    
    // Inventory sessions
    const [inventorySessions] = await pool.query(`
      SELECT * FROM inventory_sessions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    res.json({
      totalAssets: totalAssets[0].count,
      newAssets: newAssets[0].count,
      goodAssets: goodAssets[0].count,
      needsRepairAssets: needsRepairAssets[0].count,
      disposedAssets: disposedAssets[0].count,
      assetsByStatus,
      assetsByCategory,
      assetsByDepartment,
      byLocation,
      totalValue: totalValue[0] || { total_purchase: 0, total_current: 0 },
      recentAssets,
      upcomingMaintenance,
      maintenanceCosts: maintenanceCosts[0] || { total_cost: 0, total_records: 0 },
      inventorySessions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
