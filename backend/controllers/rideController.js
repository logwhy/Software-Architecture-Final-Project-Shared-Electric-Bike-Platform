// backend/controllers/rideController.js
const { startRide, finishRide } = require('../models/ride');

const start = async (req, res) => {
    const { vehicleId } = req.body;
    const userId = req.user.id;

    if (!vehicleId) {
        return res.status(400).json({ message: '缺少车辆ID' });
    }

    try {
        const ride = await startRide(userId, vehicleId);
        res.json({
            message: '开始骑行',
            ride: {
                id: ride.id,           // 必须返回 id
                start_time: ride.start_time
            }
        })    } catch (err) {
        res.status(400).json({ message: err.message || '解锁失败' });
    }
};

const finish = async (req, res) => {
    const { rideId } = req.body;
    const userId = req.user.id;

    if (!rideId) {
        return res.status(400).json({ message: '缺少骑行ID' });
    }

    try {
        const result = await finishRide(userId, rideId);
        res.json({
            message: '骑行结束',
            fee: result.fee,        // 必须包含 fee
            minutes: result.minutes
        });
    } catch (err) {
        res.status(400).json({ message: err.message || '结束失败' });
    }
};

module.exports = { start , finish};
