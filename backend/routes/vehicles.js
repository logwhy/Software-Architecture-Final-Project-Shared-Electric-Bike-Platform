// backend/routes/vehicles.js
const express = require('express');
const router = express.Router();
const { getVehicles } = require('../controllers/vehicleController');
const auth = require('../middleware/auth');

router.get('/', auth, getVehicles);  // 必须登录

module.exports = router;
