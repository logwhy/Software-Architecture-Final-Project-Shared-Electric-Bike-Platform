// backend/routes/adminVehicles.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminVehicleController');

// 车辆运维管理（运营 / 管理后台使用）
router.get('/', controller.listVehicles);
router.post('/', controller.createVehicleController);
router.put('/:id', controller.updateVehicleController);
router.patch('/:id/status', controller.updateVehicleStatusController);
router.delete('/:id', controller.deleteVehicleController);

module.exports = router;
