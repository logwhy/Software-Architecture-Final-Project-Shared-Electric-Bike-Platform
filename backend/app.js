const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./routes/auth');
const vehicleRouter = require('./routes/vehicles');
const rideRouter = require('./routes/ride');
const complaintRouter = require('./routes/complaint');

dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehicleRouter);
app.use('/api/ride', rideRouter);
app.use('/api/complaints', complaintRouter);
app.use('/uploads', express.static(require('path').join(__dirname, 'public/uploads')));

// 404
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

module.exports = app;
