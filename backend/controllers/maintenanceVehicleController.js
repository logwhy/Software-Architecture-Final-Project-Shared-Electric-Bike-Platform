// backend/controllers/maintenanceVehicleController.js
// Controller for the vehicle maintenance feature.  It exposes two
// endpoints:
//   GET /api/maintenance-vehicles      – returns all vehicles that are
//                                        currently in MAINTENANCE status
//   POST /api/maintenance-vehicles/:id/complete – records the result
//                                        of a maintenance operation and
//                                        resets the vehicle status to IDLE.

const VehicleTaskModel = require('../models/vehicleTask');

/**
 * List all vehicles that require maintenance.  Each item includes
 * its identifier, code and current coordinates.  Errors return a 500.
 */
exports.listMaintenanceVehicles = async (req, res) => {
    try {
        const vehicles = await VehicleTaskModel.getMaintenanceVehicles();
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: '获取维修车辆失败', error: err.message });
    }
};

/**
 * Submit the maintenance result for a specific vehicle.  The route
 * expects multipart/form-data containing resultText, latitude,
 * longitude, maintainerId and optionally a photo.  After validating
 * inputs, it delegates to the model to create a record and update
 * the vehicle status.  Errors and missing fields are reported with
 * appropriate status codes.
 */
exports.completeMaintenance = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicleId = parseInt(id, 10);
        const { maintainerId, resultText, latitude, longitude } = req.body;
        const mid = maintainerId ? parseInt(maintainerId, 10) : null;
        const lat = latitude !== undefined && latitude !== null ? parseFloat(latitude) : null;
        const lng = longitude !== undefined && longitude !== null ? parseFloat(longitude) : null;

        if (!vehicleId || !mid || !resultText || lat === null || lng === null ||
            Number.isNaN(lat) || Number.isNaN(lng)) {
            return res.status(400).json({ message: '缺少必要字段：maintainerId/resultText/latitude/longitude' });
        }

        const file = req.file;
        const resultPhotoUrl = file ? '/uploads/' + file.filename : null;

        await VehicleTaskModel.completeTask({
            vehicleId,
            maintainerId: mid,
            resultText,
            resultPhotoUrl,
            longitude: lng,
            latitude: lat
        });

        res.json({ message: '车辆维修已完成' });
    } catch (err) {
        res.status(500).json({ message: '提交维修结果失败', error: err.message });
    }
};