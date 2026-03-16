import InventorySession from '../models/InventorySession.js';

export const getAll = async (req, res) => {
  try {
    const sessions = await InventorySession.findAll();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const session = await InventorySession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Inventory session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const session = await InventorySession.create(req.body, req.user.id);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const session = await InventorySession.update(req.params.id, req.body);
    if (!session) {
      return res.status(404).json({ message: 'Inventory session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const success = await InventorySession.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Inventory session not found' });
    }
    res.json({ message: 'Inventory session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addAssets = async (req, res) => {
  try {
    const { assetIds } = req.body;
    await InventorySession.addAssets(req.params.id, assetIds);
    res.json({ message: 'Assets added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecords = async (req, res) => {
  try {
    const records = await InventorySession.getRecords(req.params.id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRecord = async (req, res) => {
  try {
    await InventorySession.updateRecord(req.params.id, req.params.recordId, {
      ...req.body,
      checked_by: req.user.id
    });
    res.json({ message: 'Record updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSummary = async (req, res) => {
  try {
    const summary = await InventorySession.getSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const complete = async (req, res) => {
  try {
    const session = await InventorySession.complete(req.params.id);
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addAssetsByDepartment = async (req, res) => {
  try {
    const { department_id } = req.body;
    if (!department_id) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    const result = await InventorySession.addAssetsByDepartment(req.params.id, department_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addAllAssets = async (req, res) => {
  try {
    const result = await InventorySession.addAllAssets(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecordsWithDepartment = async (req, res) => {
  try {
    const records = await InventorySession.getRecordsWithDepartment(req.params.id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSummaryByDepartment = async (req, res) => {
  try {
    const summary = await InventorySession.getSummaryByDepartment(req.params.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const scanAsset = async (req, res) => {
  try {
    const result = await InventorySession.handleScan(req.params.id, req.body, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
