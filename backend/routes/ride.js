// backend/routes/ride.js
const express = require('express');
const router = express.Router();
const { start , finish} = require('../controllers/rideController');
const auth = require('../middleware/auth');

router.post('/start', auth, start);
router.post('/finish', auth, finish);

module.exports = router;
