// backend/routes/maintenanceVehicles.js
// Defines routes for listing vehicles needing maintenance and
// submitting maintenance results.  Photo uploads are handled via
// multer so that maintainers can attach an image documenting the
// repair.

const express = require('express');
const router = express.Router();
const controller = require('../controllers/maintenanceVehicleController');
const multer = require('multer');
const path = require('path');

// Configure multer to save uploaded photos into the public/uploads
// directory.  Filenames are generated using the current timestamp
// combined with the original file extension to avoid collisions.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({ storage });

// List vehicles currently in maintenance
router.get('/', controller.listMaintenanceVehicles);

// Submit maintenance result with optional photo
router.post('/:id/complete', upload.single('photo'), controller.completeMaintenance);

module.exports = router;