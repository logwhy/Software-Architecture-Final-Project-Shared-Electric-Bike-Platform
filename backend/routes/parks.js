// backend/routes/parks.js
const express = require('express');
const router = express.Router();
const { getParks } = require('../controllers/parkController');
const auth = require('../middleware/auth');

router.get('/', auth, getParks);

module.exports = router;
