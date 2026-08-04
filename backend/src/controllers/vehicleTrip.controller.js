import VehicleTrip from '../models/VehicleTrip.js';

export const createTrip = async (req, res) => {
  try {
    const tripId = await VehicleTrip.create(req.body, req.user.id);
    res.status(201).json({ message: 'Ghi nhận lịch trình thành công', id: tripId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllTrips = async (req, res) => {
  try {
    const { page = 1, limit = 10, vehicle_id, driver_id, search } = req.query;
    const result = await VehicleTrip.findAll({ vehicle_id, driver_id, search }, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const affectedRows = await VehicleTrip.update(req.params.id, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch trình để cập nhật.' });
    }
    res.json({ message: 'Cập nhật lịch trình thành công.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTripById = async (req, res) => {
  try {
    const trip = await VehicleTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Không tìm thấy lịch trình' });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    await VehicleTrip.delete(req.params.id, req.user.id);
    res.json({ message: 'Xóa lịch trình thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};