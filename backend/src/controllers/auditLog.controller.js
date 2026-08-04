import AuditLog from '../models/AuditLog.js';

export const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await AuditLog.findAll(parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
