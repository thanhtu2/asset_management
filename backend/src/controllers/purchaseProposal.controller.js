import PurchaseProposal from '../models/PurchaseProposal.js';
import pool from '../config/database.js';

export const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await PurchaseProposal.findAll(req.user, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const proposal = await PurchaseProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ message: 'Phiếu đề xuất không tồn tại' });
    }
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const hasPermission = req.user?.permissions?.includes('CREATE_PURCHASE_PROPOSAL');
    const hasRole = ['admin', 'purchase-requester'].includes(req.user?.role);

    if (!hasPermission && !hasRole) {
      return res.status(403).json({ message: 'Không có quyền tạo phiếu đề xuất' });
    }
    
    // Generate code: PP-YYYYMMDD-XXX
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [count] = await pool.query('SELECT COUNT(*) as cnt FROM purchase_proposals WHERE code LIKE ?', [`PP-${today}%`]);
    const seq = String(count[0].cnt + 1).padStart(3, '0');
    const code = `PP-${today}-${seq}`;
    
    let items = req.body.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
        if (typeof items === 'string') {
          items = JSON.parse(items); // Đề phòng chuỗi bị lồng 2 lần từ FE
        }
      } catch (e) {
        items = [];
      }
    }

    let attached_file_url = null;
    if (req.file) {
      attached_file_url = `/uploads/${req.file.filename}`;
    }

    const proposalData = {
      ...req.body,
      items,
      code,
      total_amount: parseFloat(req.body.total_amount) || 0,
      attached_file_url
    };
    
    const proposal = await PurchaseProposal.create(proposalData, req.user);
    res.status(201).json(proposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const proposal = await PurchaseProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ message: 'Phiếu đề xuất không tồn tại' });
    }

    // Permission checks
    const isOwner = proposal.requester_id === req.user?.id;
    const userRole = req.user?.role || 'user';
    const permissions = req.user?.permissions || [];
    
    const isAdmin = userRole === 'admin' || permissions.includes('MANAGE_PURCHASE_PROPOSALS');
    const isDirector = userRole === 'director' || permissions.includes('APPROVE_DIRECTOR_PURCHASE');
    const isDeptLeader = userRole === 'department-leader' || permissions.includes('APPROVE_DEPARTMENT_PURCHASE');
    
    let canEdit = false;
    if (isAdmin) {
      canEdit = true;
    } else if (isOwner && ['draft', 'rejected'].includes(proposal.status)) {
      canEdit = true; // Người tạo có quyền sửa khi đang nháp hoặc bị từ chối
    } else if (isDeptLeader && proposal.status === 'department_pending') {
      canEdit = true;
    } else if (isDirector && proposal.status === 'director_pending') {
      canEdit = true;
    }

    if (!canEdit) {
      return res.status(403).json({ message: 'Không có quyền xử lý phiếu này ở trạng thái hiện tại' });
    }

    const updateData = { ...req.body };
    
    if (typeof updateData.items === 'string') {
      try {
        updateData.items = JSON.parse(updateData.items);
        if (typeof updateData.items === 'string') {
          updateData.items = JSON.parse(updateData.items);
        }
      } catch (e) {
        updateData.items = [];
      }
    }

    if (req.file) {
      updateData.attached_file_url = `/uploads/${req.file.filename}`;
    }

    if (updateData.status && updateData.status !== proposal.status) {
      const validTransitions = {
        'draft': ['department_pending'],
        'department_pending': ['director_pending', 'rejected', 'draft'],
        'director_pending': ['approved', 'rejected', 'department_pending'],
        'rejected': ['draft', 'department_pending']
      };
      
      if (!isAdmin && !validTransitions[proposal.status]?.includes(updateData.status)) {
        return res.status(400).json({ message: 'Trạng thái chuyển không hợp lệ' });
      }
    }

    const updatedProposal = await PurchaseProposal.update(req.params.id, updateData, req.user);
    res.json(updatedProposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    await PurchaseProposal.delete(req.params.id, req.user);
    res.json({ message: 'Xóa phiếu đề xuất thành công' });
  } catch (error) {
    res.status(error.message.includes('Unauthorized') ? 403 : 500).status({ message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'department_pending' THEN 1 ELSE 0 END) as department_pending,
        SUM(CASE WHEN status = 'director_pending' THEN 1 ELSE 0 END) as director_pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(total_amount) as total_value
      FROM purchase_proposals
    `);
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
