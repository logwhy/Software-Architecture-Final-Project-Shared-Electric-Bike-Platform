// backend/app.js
// Entry point for the Express application.  This file wires up
// middleware, routes and error handling.  The maintenance vehicles
// feature introduces a new route at /api/maintenance-vehicles for
// retrieving vehicles that require repair and submitting repair
// results.

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import existing routers
const authRouter = require('./routes/auth');
const vehicleRouter = require('./routes/vehicles');
const rideRouter = require('./routes/ride');
const complaintRouter = require('./routes/complaint');
const parkRouter = require('./routes/parks');
const adminRouter = require('./routes/admin');
const complaintTaskRouter = require('./routes/complaintTasks');
const adminParkFenceRouter = require('./routes/adminParkFences');
const adminVehicleRouter = require('./routes/adminVehicles');
const messageRoutes = require('./routes/messages');

// New router for maintenance vehicles (see backend/routes/maintenanceVehicles.js)
const maintenanceVehicleRouter = require('./routes/maintenanceVehicles');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehicleRouter);
app.use('/api/ride', rideRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/complaint-tasks', complaintTaskRouter);
app.use('/api/admin/park-fences', adminParkFenceRouter);
app.use('/api/admin/vehicles', adminVehicleRouter);
// Mount maintenance vehicles API before /api/parks so that the path
// does not collide with other admin routes
app.use('/api/maintenance-vehicles', maintenanceVehicleRouter);

app.use('/api/parks', parkRouter);
app.use('/api/admin', adminRouter);
app.use('/uploads', express.static(require('path').join(__dirname, 'public/uploads')));
app.use('/api/messages', messageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

module.exports = app;