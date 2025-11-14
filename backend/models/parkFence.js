// backend/models/parkFence.js
const pool = require('../config/db');

// 按园区获取围栏列表
const getFencesByPark = async (parkId) => {
    const res = await pool.query(
        `SELECT
       id,
       park_id,
       fence_type,
       name,
       coordinates,
       max_vehicles,
       created_at
     FROM park_fences
     WHERE park_id = $1
     ORDER BY id`,
        [parkId]
    );
    return res.rows;
};

// 创建围栏
const createFence = async ({ parkId, fenceType, name, coordinates, maxVehicles }) => {
    const res = await pool.query(
        `INSERT INTO park_fences (park_id, fence_type, name, coordinates, max_vehicles, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, park_id, fence_type, name, coordinates, max_vehicles, created_at`,
        [parkId, fenceType, name, coordinates, maxVehicles]
    );
    return res.rows[0];
};

// 更新围栏
const updateFence = async (id, { fenceType, name, coordinates, maxVehicles }) => {
    const res = await pool.query(
        `UPDATE park_fences
     SET fence_type = $2,
         name = $3,
         coordinates = $4,
         max_vehicles = $5
     WHERE id = $1
     RETURNING id, park_id, fence_type, name, coordinates, max_vehicles, created_at`,
        [id, fenceType, name, coordinates, maxVehicles]
    );
    return res.rows[0];
};

// 删除围栏
const deleteFence = async (id) => {
    const res = await pool.query(
        'DELETE FROM park_fences WHERE id = $1',
        [id]
    );
    return res.rowCount > 0;
};

// 统计某园区各停车围栏的车辆数量
const getParkingStatsByPark = async (parkId) => {
    const res = await pool.query(
        `SELECT
       f.id,
       f.park_id,
       f.name,
       f.max_vehicles,
       COUNT(v.id) AS current_count
     FROM park_fences f
     LEFT JOIN vehicles v ON v.parking_fence_id = f.id
     WHERE f.park_id = $1
       AND f.fence_type = 'PARKING'
     GROUP BY f.id, f.park_id, f.name, f.max_vehicles
     ORDER BY f.id`,
        [parkId]
    );
    return res.rows;
};

module.exports = {
    getFencesByPark,
    createFence,
    updateFence,
    deleteFence,
    getParkingStatsByPark,
};
