import pool from '../config/database.js';

// Lấy danh sách thông báo của người dùng hiện tại (hoặc thông báo chung)
export const getAll = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const limit = parseInt(req.query.limit) || 30;

    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    res.json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy thông báo:', error);
    res.status(500).json({ message: error.message });
  }
};

// Đánh dấu một thông báo là đã đọc
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    res.json({ message: 'Đã đánh dấu đọc' });
  } catch (error) {
    console.error('Lỗi khi đánh dấu thông báo:', error);
    res.status(500).json({ message: error.message });
  }
};

// Đánh dấu tất cả thông báo là đã đọc
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE AND (user_id = ? OR user_id IS NULL)', [userId]);
    res.json({ message: 'Đã đánh dấu đọc tất cả' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};