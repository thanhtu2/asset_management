import cron from 'node-cron';
import { getPool } from './config/database.js';
import { createNotification } from './notification.service.js';

const runMaintenanceCheck = async () => {
  console.log('Đang kiểm tra lịch bảo trì định kỳ...');
  try {
    const db = getPool();
    
    const [upcoming] = await db.query(`
      SELECT a.id, a.asset_code, a.name, m.next_maintenance_date 
      FROM assets a
      JOIN maintenance_records m ON a.id = m.asset_id
      WHERE m.next_maintenance_date IS NOT NULL 
        AND m.next_maintenance_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);

    let processed = 0;
    for (const item of upcoming) {
      await createNotification(
        null,
        'Bảo trì sắp đến hạn',
        `Tài sản "${item.name}" (${item.asset_code}) cần được bảo trì vào ngày ${new Date(item.next_maintenance_date).toLocaleDateString('vi-VN')}.`,
        'maintenance'
      );
      processed++;
    }
    console.log(`✅ Cron Job completed. Processed ${processed} notifications.`);
  } catch (error) {
    console.error('Lỗi khi chạy Cron Job bảo trì:', error);
  }
};

export const initCronJobs = () => {
  // '* * * * *' test every minute, change to '0 8 * * *' for production
  cron.schedule('* * * * *', runMaintenanceCheck);
};

export { runMaintenanceCheck };

