// backend/controllers/vehicleController.js
const { getAllVehicles } = require('../models/vehicle');

const getVehicles = async (req, res) => {
    try {
        const { parkId } = req.query;

        // 验证 parkId 是否为数字
        const validatedParkId = parkId && !isNaN(parkId) ? parseInt(parkId) : null;

        const vehicles = await getAllVehicles(validatedParkId);

        res.json({
            success: true,
            vehicles
        });
    } catch (err) {
        console.error('获取车辆失败:', err);
        res.status(500).json({
            success: false,
            message: '获取车辆失败'
        });
    }
};

module.exports = { getVehicles };
