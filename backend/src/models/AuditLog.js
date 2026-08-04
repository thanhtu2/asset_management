import pool from '../config/database.js';

const AuditLog = {
  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(`
      SELECT a.*, u.fullName as user_name, u.username
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM audit_logs');
    
    return {
      data: rows,
      pagination: {
        page, limit, total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    };
  },

  async log(userId, action, entityType, entityId, oldValues, newValues, description, ipAddress) {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, description, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, JSON.stringify(oldValues), JSON.stringify(newValues), description, ipAddress]
    );
  }
};

export default AuditLog;