import cron from 'node-cron';
import pool from '../config/database.js';
import { createNotification } from './notification.service.js';

export const initCronJobs = () => {
  // Chạy vào lúc 08:00 sáng mỗi ngày
  cron.schedule('0 8 * * *', async () => {
    console.log('Đang kiểm tra lịch bảo trì định kỳ...');
    try {
      // Tìm các tài sản có ngày bảo trì tiếp theo trong vòng 7 ngày tới
      const [upcoming] = await pool.query(`
        SELECT a.id, a.asset_code, a.name, m.next_maintenance_date 
        FROM assets a
        JOIN maintenance_records m ON a.id = m.asset_id
        WHERE m.next_maintenance_date IS NOT NULL 
          AND m.next_maintenance_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      `);

      for (const item of upcoming) {
        await createNotification(
          null,
          'Bảo trì sắp đến hạn',
          `Tài sản "${item.name}" (${item.asset_code}) cần được bảo trì vào ngày ${new Date(item.next_maintenance_date).toLocaleDateString('vi-VN')}.`,
          'maintenance'
        );
      }
    } catch (error) {
      console.error('Lỗi khi chạy Cron Job bảo trì:', error);
    }
  });
};