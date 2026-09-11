import Changelog from '../models/Changelog.js';
import AuditLog from '../models/AuditLog.js';

const allowedTypes = new Set(['feature', 'fix', 'security']);

const validatePayload = (body) => {
  const { version, release_date, title, type, description } = body;
  if (!version || !release_date || !title || !description) return 'Vui lòng nhập đầy đủ phiên bản, ngày phát hành, tiêu đề và nội dung.';
  if (!allowedTypes.has(type)) return 'Loại cập nhật không hợp lệ.';
  return null;
};

export const getChangelogs = async (req, res) => {
  try {
    res.json({ data: await Changelog.findAll() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createChangelog = async (req, res) => {
  try {
    const validationError = validatePayload(req.body);
    if (validationError) return res.status(400).json({ message: validationError });
    const id = await Changelog.create({ ...req.body, userId: req.user.id });
    await AuditLog.log(req.user.id, 'CREATE', 'changelog', id, null, req.body, `Tạo lịch sử cập nhật phiên bản ${req.body.version}`, req.ip);
    res.status(201).json({ id, message: 'Đã thêm lịch sử cập nhật.' });
  } catch (error) {
    res.status(error.code === 'ER_DUP_ENTRY' ? 400 : 500).json({ message: error.code === 'ER_DUP_ENTRY' ? 'Phiên bản đã tồn tại.' : error.message });
  }
};

export const updateChangelog = async (req, res) => {
  try {
    const validationError = validatePayload(req.body);
    if (validationError) return res.status(400).json({ message: validationError });
    const affectedRows = await Changelog.update(req.params.id, req.body);
    if (!affectedRows) return res.status(404).json({ message: 'Không tìm thấy lịch sử cập nhật.' });
    await AuditLog.log(req.user.id, 'UPDATE', 'changelog', req.params.id, null, req.body, `Cập nhật lịch sử phiên bản ${req.body.version}`, req.ip);
    res.json({ message: 'Đã cập nhật lịch sử cập nhật.' });
  } catch (error) {
    res.status(error.code === 'ER_DUP_ENTRY' ? 400 : 500).json({ message: error.code === 'ER_DUP_ENTRY' ? 'Phiên bản đã tồn tại.' : error.message });
  }
};

export const deleteChangelog = async (req, res) => {
  try {
    const affectedRows = await Changelog.remove(req.params.id);
    if (!affectedRows) return res.status(404).json({ message: 'Không tìm thấy lịch sử cập nhật.' });
    await AuditLog.log(req.user.id, 'DELETE', 'changelog', req.params.id, null, null, 'Xóa lịch sử cập nhật', req.ip);
    res.json({ message: 'Đã xóa lịch sử cập nhật.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
