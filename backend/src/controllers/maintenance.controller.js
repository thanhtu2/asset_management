import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Asset from '../models/Asset.js';

export const getAll = async (req, res) => {
  try {
    const records = await MaintenanceRecord.findAll(req.query);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const record = await MaintenanceRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const record = await MaintenanceRecord.create(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const record = await MaintenanceRecord.update(req.params.id, req.body);
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const success = await MaintenanceRecord.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUpcoming = async (req, res) => {
  try {
    const records = await MaintenanceRecord.getUpcoming();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCosts = async (req, res) => {
  try {
    const costs = await MaintenanceRecord.getCosts(req.query);
    res.json(costs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeRepair = async (req, res) => {
  try {
    const { asset_id, maintenance_id } = req.body;
    
    if (!asset_id || !maintenance_id) {
      return res.status(400).json({ message: 'Thiếu thông tin tài sản hoặc ID bảo trì' });
    }

    // Update asset status to "good"
    const asset = await Asset.update(asset_id, { status: 'good' });
    if (!asset) {
      return res.status(404).json({ message: 'Tài sản không tồn tại' });
    }

    // Update maintenance record status to "completed"
    await MaintenanceRecord.update(maintenance_id, { 
        status: 'completed',
        completion_date: new Date()
    });

    res.json({ message: 'Đã hoàn thành sửa chữa, cập nhật trạng thái tài sản và phiếu bảo trì.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
