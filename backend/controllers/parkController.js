// backend/controllers/parkController.js
const { getParksByUser } = require('../models/park');

const getParks = async (req, res) => {
    try {
        const parks = await getParksByUser(req.user.id, req.user.role);

        res.json({
            success: true,
            parks
        });
    } catch (err) {
        console.error('获取园区列表失败:', err);
        res.status(500).json({
            success: false,
            message: '获取园区列表失败'
        });
    }
};

module.exports = {
    getParks
};
