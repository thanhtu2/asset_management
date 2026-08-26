import pool from '../config/database.js';

const SupportRequest = {
  async findAll(filters = {}, page = 1, limit = 10, user) {
    const conditions = ['1=1'];
    const params = [];

    if (user?.role !== 'admin' && !user?.permissions?.includes('VIEW_SUPPORT_REPORTS')) {
      conditions.push('(r.requester_id = ? OR r.department_id = ?)');
      params.push(user.id, user.department_id || -1);
    }
    if (filters.status) {
      conditions.push('r.status = ?');
      params.push(filters.status);
    }
    if (filters.category) {
      conditions.push('r.category = ?');
      params.push(filters.category);
    }
    if (filters.priority) {
      conditions.push('r.priority = ?');
      params.push(filters.priority);
    }
    if (filters.search) {
      conditions.push('(r.request_number LIKE ? OR r.title LIKE ? OR r.description LIKE ?)');
      const search = `%${filters.search}%`;
      params.push(search, search, search);
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (pageNumber - 1) * limitNumber;
    const where = conditions.join(' AND ');

    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM technical_support_requests r WHERE ${where}`, params);
    const [rows] = await pool.query(`
      SELECT r.*, a.asset_code, a.name AS asset_name,
        requester.fullName AS requester_name, d.name AS department_name,
        assignee.fullName AS assignee_name
      FROM technical_support_requests r
      LEFT JOIN assets a ON r.asset_id = a.id
      LEFT JOIN users requester ON r.requester_id = requester.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN users assignee ON r.assigned_to = assignee.id
      WHERE ${where}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNumber, offset]);

    return {
      data: rows,
      pagination: { page: pageNumber, limit: limitNumber, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / limitNumber) }
    };
  },

  async findById(id, user) {
    const [rows] = await pool.query(`
      SELECT r.*, a.asset_code, a.name AS asset_name,
        requester.fullName AS requester_name, d.name AS department_name,
        assignee.fullName AS assignee_name
      FROM technical_support_requests r
      LEFT JOIN assets a ON r.asset_id = a.id
      LEFT JOIN users requester ON r.requester_id = requester.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN users assignee ON r.assigned_to = assignee.id
      WHERE r.id = ?
    `, [id]);
    const request = rows[0];
    if (!request) return null;
    const canViewAll = user?.role === 'admin' || user?.permissions?.includes('VIEW_SUPPORT_REPORTS');
    if (!canViewAll && request.requester_id !== user.id && request.department_id !== user.department_id) return null;
    const [history] = await pool.query(`
      SELECT h.*, u.fullName AS actor_name
      FROM technical_support_histories h
      LEFT JOIN users u ON h.actor_id = u.id
      WHERE h.request_id = ? ORDER BY h.created_at ASC
    `, [id]);
    return { ...request, history };
  },

  async create(data, user) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const requestNumber = `HTKT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Date.now().toString().slice(-6)}`;
      const [result] = await connection.query(`
        INSERT INTO technical_support_requests
          (request_number, title, description, category, priority, asset_id, requester_id, department_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
      `, [requestNumber, data.title, data.description, data.category, data.priority || 'normal', data.asset_id || null, user.id, data.department_id || user.department_id || null]);
      await connection.query(`
        INSERT INTO technical_support_histories (request_id, actor_id, action, new_status, comment)
        VALUES (?, ?, 'created', 'submitted', ?)
      `, [result.insertId, user.id, data.description || 'Tạo phiếu yêu cầu hỗ trợ']);
      await connection.commit();
      return this.findById(result.insertId, { ...user, role: 'admin' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async update(id, data, user) {
    const existing = await this.findById(id, { ...user, role: 'admin' });
    if (!existing) return null;
    const nextStatus = data.status || existing.status;
    const allowedStatuses = ['submitted', 'assigned', 'in_progress', 'waiting_user', 'resolved', 'closed', 'rejected', 'cancelled'];
    if (!allowedStatuses.includes(nextStatus)) throw new Error('Trạng thái phiếu không hợp lệ');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(`
        UPDATE technical_support_requests SET status = ?, assigned_to = COALESCE(?, assigned_to),
          resolution_summary = COALESCE(?, resolution_summary), resolution_cost = COALESCE(?, resolution_cost),
          first_response_at = CASE WHEN ? IN ('assigned', 'in_progress') AND first_response_at IS NULL THEN NOW() ELSE first_response_at END,
          started_at = CASE WHEN ? = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
          resolved_at = CASE WHEN ? = 'resolved' THEN NOW() ELSE resolved_at END,
          closed_at = CASE WHEN ? = 'closed' THEN NOW() ELSE closed_at END
        WHERE id = ?
      `, [nextStatus, data.assigned_to || null, data.resolution_summary || null, data.resolution_cost ?? null, nextStatus, nextStatus, nextStatus, nextStatus, id]);
      await connection.query(`
        INSERT INTO technical_support_histories (request_id, actor_id, action, old_status, new_status, comment)
        VALUES (?, ?, 'status_changed', ?, ?, ?)
      `, [id, user.id, existing.status, nextStatus, data.comment || null]);
      await connection.commit();
      return this.findById(id, { ...user, role: 'admin' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

export default SupportRequest;
