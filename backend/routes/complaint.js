const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const multer = require('multer');
const path = require('path');

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

// 提交投诉
router.post('/', upload.single('photo'), complaintController.createComplaint);
// 获取投诉列表
router.get('/', complaintController.getComplaints);
// 处理投诉
router.post('/:id/handle', complaintController.handleComplaint);

module.exports = router;
