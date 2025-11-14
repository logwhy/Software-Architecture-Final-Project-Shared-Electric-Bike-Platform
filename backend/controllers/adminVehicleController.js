// backend/controllers/adminVehicleController.js
const {
    getAllVehiclesForAdmin,
    createVehicle,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle
} = require('../models/vehicle');

// GET /api/admin/vehicles?parkId=xxx
const listVehicles = async (req, res) => {
    try {
        const { parkId } = req.query;
        const pid = parkId && !isNaN(parkId) ? parseInt(parkId, 10) : null;
        const vehicles = await getAllVehiclesForAdmin(pid);
        res.json(vehicles);
    } catch (err) {
        console.error('获取车辆列表失败:', err);
        res.status(500).json({ message: '获取车辆列表失败' });
    }
};

// POST /api/admin/vehicles
const createVehicleController = async (req, res) => {
    try {
        const { code, parkId, battery, longitude, latitude } = req.body;

        if (!code || !parkId) {
            return res.status(400).json({ message: '车辆编码和园区必填' });
        }

        const vehicle = await createVehicle({
            code,
            parkId: parseInt(parkId, 10),
            battery: battery !== undefined ? parseInt(battery, 10) : null,
            longitude: longitude !== undefined ? parseFloat(longitude) : null,
            latitude: latitude !== undefined ? parseFloat(latitude) : null
        });

        res.status(201).json(vehicle);
    } catch (err) {
        console.error('创建车辆失败:', err);
        res.status(500).json({ message: '创建车辆失败' });
    }
};

// PUT /api/admin/vehicles/:id
const updateVehicleController = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, parkId, battery, longitude, latitude } = req.body;

        if (!code || !parkId) {
            return res.status(400).json({ message: '车辆编码和园区必填' });
        }

        const vehicle = await updateVehicle(parseInt(id, 10), {
            code,
            parkId: parseInt(parkId, 10),
            battery: battery !== undefined ? parseInt(battery, 10) : null,
            longitude: longitude !== undefined ? parseFloat(longitude) : null,
            latitude: latitude !== undefined ? parseFloat(latitude) : null
        });

        if (!vehicle) {
            return res.status(404).json({ message: '车辆不存在' });
        }

        res.json(vehicle);
    } catch (err) {
        console.error('更新车辆失败:', err);
        res.status(500).json({ message: '更新车辆失败' });
    }
};

// PATCH /api/admin/vehicles/:id/status
const updateVehicleStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['IDLE', 'MAINTENANCE'].includes(status)) {
            return res.status(400).json({ message: '非法状态，只允许设置为 IDLE 或 MAINTENANCE' });
        }

        const vehicle = await updateVehicleStatus(parseInt(id, 10), status);

        if (!vehicle) {
            return res.status(404).json({ message: '车辆不存在' });
        }

        res.json(vehicle);
    } catch (err) {
        console.error('更新车辆状态失败:', err);
        res.status(500).json({ message: '更新车辆状态失败' });
    }
};

// DELETE /api/admin/vehicles/:id
const deleteVehicleController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteVehicle(parseInt(id, 10));

        if (!result.ok) {
            if (result.reason === 'NOT_FOUND') {
                return res.status(404).json({ message: '车辆不存在' });
            }
            if (result.reason === 'IN_USE') {
                return res.status(400).json({ message: '车辆使用中，不能删除' });
            }
        }

        res.json({ message: '车辆已删除' });
    } catch (err) {
        console.error('删除车辆失败:', err);
        res.status(500).json({ message: '删除车辆失败' });
    }
};

module.exports = {
    listVehicles,
    createVehicleController,
    updateVehicleController,
    updateVehicleStatusController,
    deleteVehicleController
};
