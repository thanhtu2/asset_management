import express from 'express';
import { pool } from '../config/database.js';
import { createNotification } from '../notification.service.js';

const router = express.Router();

// Vercel Cron Job endpoint - No auth required (system-only)
router.get('/maintenance-check', async (req, res) => {
  console.log('✅ Vercel Cron Job: Kiểm tra bảo trì định kỳ triggered');
  
  try {
    // Tìm assets cần bảo trì trong 7 ngày tới (same logic as cron.service)
    const [upcoming] = await pool.query(`
      SELECT a.id, a.asset_code, a.name, m.next_maintenance_date 
      FROM assets a
      JOIN maintenance_records m ON a.id = m.asset_id
      WHERE m.next_maintenance_date IS NOT NULL 
        AND m.next_maintenance_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);

    let processed = 0;
    for (const item of upcoming) {
      await createNotification(
        null,  // null = system notification for all
        'Bảo trì sắp đến hạn',
        `Tài sản "${item.name}" (${item.asset_code}) cần được bảo trì vào ngày ${new Date(item.next_maintenance_date).toLocaleDateString('vi-VN')}.`,
        'maintenance'
      );
      processed++;
    }

    console.log(`✅ Processed ${processed} upcoming maintenance notifications`);
    res.json({ 
      success: true, 
      message: `Processed ${processed} notifications`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Vercel Cron Job error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;

