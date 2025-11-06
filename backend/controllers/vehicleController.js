// backend/controllers/vehicleController.js
const { getAllVehicles } = require('../models/vehicle');

const getVehicles = async (req, res) => {
    try {
        const vehicles = await getAllVehicles();
        res.json({ vehicles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '获取车辆失败' });
    }
};

module.exports = { getVehicles };
