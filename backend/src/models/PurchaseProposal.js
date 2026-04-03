import pool from '../config/database.js';
import { createNotification } from '../notification.service.js';

const PurchaseProposal = {
  // Get all proposals with role-based filtering
  async findAll(currentUser, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT pp.*, 
             u1.fullName as requester_name,
             d.name as department_name,
             u2.fullName as department_leader_name,
             u3.fullName as director_name
      FROM purchase_proposals pp
      LEFT JOIN users u1 ON pp.requester_id = u1.id
      LEFT JOIN departments d ON pp.department_id = d.id
      LEFT JOIN users u2 ON pp.department_leader_id = u2.id
      LEFT JOIN users u3 ON pp.director_id = u3.id
    `;
    let params = [];
    let whereClause = 'WHERE 1=1';

    if (currentUser) {
      const { id, role, department_id, permissions = [] } = currentUser;
      
      const isAdmin = role === 'admin' || permissions.includes('MANAGE_PURCHASE_PROPOSALS');
      const isDirector = role === 'director' || permissions.includes('APPROVE_DIRECTOR_PURCHASE');
      const isDeptLeader = role === 'department-leader' || permissions.includes('APPROVE_DEPARTMENT_PURCHASE');

      if (isAdmin) {
        // Admin xem được tất cả mọi phiếu
      } else if (isDirector) {
        // Giám đốc xem được các phiếu đã duyệt qua phòng, hoặc do chính mình tạo
        whereClause += " AND (pp.status IN ('director_pending', 'approved', 'rejected') OR pp.requester_id = ?)";
        params.push(id);
      } else if (isDeptLeader) {
        // Trưởng phòng xem được các phiếu của phòng (trừ phiếu nháp của nhân viên), hoặc do chính mình tạo
        if (department_id) {
          whereClause += " AND ((pp.department_id = ? AND pp.status != 'draft') OR pp.requester_id = ?)";
          params.push(department_id, id);
        } else {
          whereClause += ' AND pp.requester_id = ?';
          params.push(id);
        }
      } else {
        // Các role khác (user, purchase-requester) chỉ xem được phiếu do chính mình lập
        whereClause += ' AND pp.requester_id = ?';
        params.push(id);
      }
    }

    query += ' ' + whereClause + ' ORDER BY pp.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // Count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM purchase_proposals pp ${whereClause}`;
    const [countResult] = await pool.query(countQuery, params.slice(0, -2));
    
    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    };
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT pp.*, 
             u1.fullName as requester_name,
             d.name as department_name,
             u2.fullName as department_leader_name,
             u3.fullName as director_name
      FROM purchase_proposals pp
      LEFT JOIN users u1 ON pp.requester_id = u1.id
      LEFT JOIN departments d ON pp.department_id = d.id
      LEFT JOIN users u2 ON pp.department_leader_id = u2.id
      LEFT JOIN users u3 ON pp.director_id = u3.id
      WHERE pp.id = ?
    `, [id]);
    return rows[0];
  },

  async create(proposalData, currentUser) {
    const {
      code, title, description, department_id, items, total_amount, status
    } = proposalData;

    const finalCode = code || `PR-${Date.now()}`;
    const requesterId = currentUser?.id || proposalData.requester_id;

    if (!requesterId) throw new Error('Lỗi: Không tìm thấy ID người tạo (requester_id)');
    
    const [result] = await pool.query(
      `INSERT INTO purchase_proposals (code, title, description, requester_id, department_id, items, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [finalCode, title, description, requesterId, department_id || null, JSON.stringify(items || []), total_amount || 0, status || 'draft']
    );
    
    const newProposal = await this.findById(result.insertId);
    
    // Gửi thông báo nếu tạo mới và gửi duyệt ngay lập tức
    if (status && status !== 'draft') {
      await this._sendStatusNotification(newProposal, status, currentUser);
    }
    
    return newProposal;
  },

  async update(id, updateData, currentUser) {
    const proposal = await this.findById(id);
    if (!proposal) throw new Error('Proposal not found');

    // Sanitize data
    if (updateData.department_id === '') updateData.department_id = null;
    if (updateData.items && typeof updateData.items !== 'string') {
      updateData.items = JSON.stringify(updateData.items);
    }

    // Workflow validation
    const newStatus = updateData.status;
    if (newStatus && newStatus !== proposal.status) {
      const userRole = currentUser?.role || 'user';
      const permissions = currentUser?.permissions || [];

      const isAdmin = userRole === 'admin' || permissions.includes('MANAGE_PURCHASE_PROPOSALS');
      const isDirector = userRole === 'director' || permissions.includes('APPROVE_DIRECTOR_PURCHASE');
      const isDeptLeader = userRole === 'department-leader' || permissions.includes('APPROVE_DEPARTMENT_PURCHASE');
      
      if (newStatus === 'director_pending' && (isDeptLeader || isAdmin)) {
        updateData.department_leader_id = currentUser?.id;
      } else if (newStatus === 'approved' && (isDirector || isAdmin)) {
        updateData.director_id = currentUser?.id;
      }
      
      // Create notifications
      await this._sendStatusNotification(proposal, newStatus, currentUser);
    }

    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData).concat(id);
    
    await pool.query(`UPDATE purchase_proposals SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id, currentUser) {
    const proposal = await this.findById(id);
    if (!proposal || proposal.requester_id !== currentUser.id) {
      throw new Error('Unauthorized');
    }
    if (proposal.status !== 'draft') {
      throw new Error('Cannot delete submitted proposal');
    }
    
    const [result] = await pool.query('DELETE FROM purchase_proposals WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async _sendStatusNotification(proposal, newStatus, actor) {
    let title, message, recipients = [];
    
    switch (newStatus) {
      case 'department_pending':
        title = 'Phiếu đề xuất đã gửi duyệt phòng';
        message = `Phiếu ${proposal.code} đã được gửi duyệt.`;
        recipients = [proposal.department_leader_id].filter(Boolean);
        break;
      case 'director_pending':
        title = 'Phiếu đề xuất đã duyệt phòng';
        message = `Phiếu ${proposal.code} đã được trưởng phòng duyệt.`;
        // Notify director (find director role user)
        const [directors] = await pool.query('SELECT id FROM users WHERE role = ?', ['director']);
        recipients = directors.map(d => d.id);
        break;
      case 'approved':
        title = 'Phiếu đề xuất đã được phê duyệt';
        message = `Phiếu ${proposal.code} đã được giám đốc phê duyệt.`;
        recipients = [proposal.requester_id];
        break;
      case 'rejected':
        title = 'Phiếu đề xuất bị từ chối';
        message = `Phiếu ${proposal.code} bị từ chối.`;
        recipients = [proposal.requester_id];
        break;
    }
    
    for (const userId of recipients) {
      await createNotification(userId, title, message, 'purchase');
    }
  }
};

export default PurchaseProposal;
