// backend/models/vehicle.js
const pool = require('../config/db');

// 前台地图使用：获取可用车辆（排除维修中）
const getAllVehicles = async (parkId = null) => {
    let query = `
    SELECT
      id, code, status, battery, park_id,
      ST_AsGeoJSON(location)::jsonb AS location_geojson
    FROM vehicles
    WHERE status != 'MAINTENANCE'
  `;

    const params = [];

    if (parkId) {
        query += ' AND park_id = $1';
        params.push(parkId);
    }

    const res = await pool.query(query, params);

    return res.rows.map(row => ({
        ...row,
        location: row.location_geojson
    }));
};

// 管理后台使用：获取全部车辆（包含维修中）
const getAllVehiclesForAdmin = async (parkId = null) => {
    let query = `
    SELECT
      id, code, status, battery, park_id,
      ST_X(location::geometry) AS longitude,
      ST_Y(location::geometry) AS latitude
    FROM vehicles
    WHERE 1 = 1
  `;
    const params = [];

    if (parkId) {
        query += ' AND park_id = $1';
        params.push(parkId);
    }

    const res = await pool.query(query, params);
    return res.rows.map(row => ({
        ...row,
        longitude: row.longitude,
        latitude: row.latitude
    }));
};

// 新车投放
const createVehicle = async ({ code, parkId, battery, longitude, latitude }) => {
    const batteryValue = (battery === undefined || battery === null || battery === '') ? null : battery;
    const lngValue = (longitude === undefined || longitude === null || longitude === '') ? null : longitude;
    const latValue = (latitude === undefined || latitude === null || latitude === '') ? null : latitude;

    const res = await pool.query(
        `INSERT INTO vehicles (code, park_id, status, battery, location, created_at, updated_at)
     VALUES (
       $1,
       $2,
       'IDLE',
       COALESCE($3, 100),
       CASE
         WHEN $4 IS NULL OR $5 IS NULL THEN NULL
         ELSE ST_SetSRID(ST_MakePoint($4, $5), 4326)
       END,
       NOW(),
       NOW()
     )
     RETURNING id, code, status, battery, park_id,
       ST_X(location::geometry) AS longitude,
       ST_Y(location::geometry) AS latitude`,
        [code, parkId, batteryValue, lngValue, latValue]
    );
    return res.rows[0];
};

// 更新车辆信息（不含状态流转）
const updateVehicle = async (id, { code, parkId, battery, longitude, latitude }) => {
    const batteryValue = (battery === undefined || battery === null || battery === '') ? null : battery;
    const lngValue = (longitude === undefined || longitude === null || longitude === '') ? null : longitude;
    const latValue = (latitude === undefined || latitude === null || latitude === '') ? null : latitude;

    const res = await pool.query(
        `UPDATE vehicles
     SET code = $2,
         park_id = $3,
         battery = COALESCE($4, battery),
         location = CASE
           WHEN $5 IS NULL OR $6 IS NULL THEN location
           ELSE ST_SetSRID(ST_MakePoint($5, $6), 4326)
         END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, code, status, battery, park_id,
       ST_X(location::geometry) AS longitude,
       ST_Y(location::geometry) AS latitude`,
        [id, code, parkId, batteryValue, lngValue, latValue]
    );
    return res.rows[0];
};

// 更新车辆状态（只允许 IDLE / MAINTENANCE）
const updateVehicleStatus = async (id, status) => {
    const res = await pool.query(
        `UPDATE vehicles
     SET status = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, code, status, battery, park_id,
       ST_X(location::geometry) AS longitude,
       ST_Y(location::geometry) AS latitude`,
        [id, status]
    );
    return res.rows[0];
};

// 删除车辆（使用中车辆禁止删除）
const deleteVehicle = async (id) => {
    const check = await pool.query(
        'SELECT status FROM vehicles WHERE id = $1',
        [id]
    );
    if (check.rows.length === 0) {
        return { ok: false, reason: 'NOT_FOUND' };
    }
    if (check.rows[0].status === 'IN_USE') {
        return { ok: false, reason: 'IN_USE' };
    }
    await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
    return { ok: true };
};

module.exports = {
    getAllVehicles,            // 给 /api/vehicles 用（地图）
    getAllVehiclesForAdmin,    // 管理后台列表
    createVehicle,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle
};
