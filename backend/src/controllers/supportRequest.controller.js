import SupportRequest from '../models/SupportRequest.js';
import AuditLog from '../models/AuditLog.js';
import pool from '../config/database.js';
import { createNotification } from '../notification.service.js';

const notifySupportUsers = async (userIds, title, message, type = 'info') => {
  await Promise.all([...new Set(userIds.filter(Boolean))].map(userId => (
    createNotification(userId, title, message, type)
  )));
};

export const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, priority, search } = req.query;
    res.json(await SupportRequest.findAll({ status, category, priority, search }, page, limit, req.user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const request = await SupportRequest.findById(req.params.id, req.user);
    if (!request) return res.status(404).json({ message: 'Không tìm thấy phiếu yêu cầu hỗ trợ' });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { title, description, category, priority, asset_id } = req.body;
    if (!title?.trim() || !description?.trim() || !category) {
      return res.status(400).json({ message: 'Tiêu đề, mô tả và danh mục là bắt buộc' });
    }
    const request = await SupportRequest.create({ title: title.trim(), description: description.trim(), category, priority, asset_id }, req.user);
    await AuditLog.log(req.user.id, 'CREATE', 'technical_support_request', request.id, null, request, `Tạo phiếu hỗ trợ ${request.request_number}`, req.ip);

    const [processors] = await pool.query(`
      SELECT DISTINCT u.id
      FROM users u
      LEFT JOIN role_permissions rp ON rp.role_code = u.role
      WHERE u.isActive = TRUE
        AND (u.role = 'admin' OR rp.permission_code = 'PROCESS_SUPPORT_REQUEST')
        AND u.id <> ?
    `, [req.user.id]);

    await Promise.all(processors.map((processor) => createNotification(
      processor.id,
      'Phiếu hỗ trợ mới',
      `${req.user.fullName || req.user.username || 'Người dùng'} vừa tạo phiếu ${request.request_number}: ${request.title}`,
      'info'
    )));

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const existing = await SupportRequest.findById(req.params.id, { ...req.user, role: 'admin' });
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy phiếu yêu cầu hỗ trợ' });
    const request = await SupportRequest.update(req.params.id, req.body, req.user);
    if (!request) return res.status(404).json({ message: 'Không tìm thấy phiếu yêu cầu hỗ trợ' });
    await AuditLog.log(req.user.id, 'UPDATE', 'technical_support_request', request.id, null, request, `Cập nhật phiếu hỗ trợ ${request.request_number}`, req.ip);

    const recipients = [request.requester_id, request.assigned_to]
      .filter(userId => userId && userId !== req.user.id);
    const statusChanged = existing.status !== request.status;
    await notifySupportUsers(
      recipients,
      statusChanged ? 'Phiếu hỗ trợ cập nhật trạng thái' : 'Phiếu hỗ trợ đã được cập nhật',
      statusChanged
        ? `Phiếu ${request.request_number} đã chuyển sang trạng thái: ${request.status}.`
        : `Phiếu ${request.request_number} vừa được cập nhật.`,
      ['rejected', 'cancelled'].includes(request.status) ? 'warning' : 'info'
    );

    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
