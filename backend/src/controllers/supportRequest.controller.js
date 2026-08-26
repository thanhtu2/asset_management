import SupportRequest from '../models/SupportRequest.js';
import AuditLog from '../models/AuditLog.js';

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
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const request = await SupportRequest.update(req.params.id, req.body, req.user);
    if (!request) return res.status(404).json({ message: 'Không tìm thấy phiếu yêu cầu hỗ trợ' });
    await AuditLog.log(req.user.id, 'UPDATE', 'technical_support_request', request.id, null, request, `Cập nhật phiếu hỗ trợ ${request.request_number}`, req.ip);
    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
