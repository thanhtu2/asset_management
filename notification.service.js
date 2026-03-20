import pool from './src/config/database.js';

/**
 * Tạo một thông báo mới
 * @param {number|null} userId - ID người dùng nhận (NULL = gửi cho tất cả Admin)
 * @param {string} title - Tiêu đề thông báo
 * @param {string} message - Nội dung chi tiết
 * @param {string} type - Loại thông báo (info, success, warning, maintenance)
 */
export const createNotification = async (userId, title, message, type = 'info') => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message, type]
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo:', error);
  }
};

export const getNotifications = async (userId, limit = 20) => {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  return rows;
};