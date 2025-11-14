// backend/models/vehicle.js
const pool = require('../config/db');

// 前台地图使用：获取可用车辆（排除维修中）
const getAllVehicles = async (parkId = null) => {
    let query = `
        SELECT
            id,
            code,
            status,
            battery,
            park_id,
            parking_fence_id,
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
            id,
            code,
            status,
            battery,
            park_id,
            parking_fence_id,
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

// 把经纬度拼成 WKT（给 SQL 用）
const buildLocationWkt = (longitude, latitude) => {
    if (
        longitude === undefined ||
        longitude === null ||
        longitude === '' ||
        latitude === undefined ||
        latitude === null ||
        latitude === ''
    ) {
        return null;
    }
    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    if (Number.isNaN(lng) || Number.isNaN(lat)) {
        return null;
    }
    // 简单写成 POINT(lon lat)，SRID 在 SQL 里用 ST_SetSRID 设置
    return `POINT(${lng} ${lat})`;
};

// 新车投放
const createVehicle = async ({ code, parkId, battery, longitude, latitude, parkingFenceId }) => {
    const batteryValue =
        battery === undefined || battery === null || battery === '' ? null : parseInt(battery, 10);
    const fenceValue =
        parkingFenceId === undefined || parkingFenceId === null || parkingFenceId === ''
            ? null
            : parseInt(parkingFenceId, 10);

    const locationWkt = buildLocationWkt(longitude, latitude);

    const res = await pool.query(
        `INSERT INTO vehicles (
            code,
            park_id,
            status,
            battery,
            location,
            parking_fence_id,
            created_at,
            updated_at
        )
         VALUES (
                    $1,
                    $2,
                    'IDLE',
                    COALESCE($3::integer, 100),
                    CASE
                        WHEN $4::varchar IS NULL THEN NULL
                ELSE ST_SetSRID(ST_GeomFromText($4::varchar), 4326)
                        END,
                    $5,
                    NOW(),
                    NOW()
                )
             RETURNING
            id,
            code,
            status,
            battery,
            park_id,
            parking_fence_id,
            ST_X(location::geometry) AS longitude,
            ST_Y(location::geometry) AS latitude`,
        [code, parkId, batteryValue, locationWkt, fenceValue]
    );
    console.log("locationWkt =", locationWkt);


    return res.rows[0];
};


// 更新车辆信息（不含状态流转）
const updateVehicle = async (id, { code, parkId, battery, longitude, latitude, parkingFenceId }) => {
    const batteryValue =
        battery === undefined || battery === null || battery === '' ? null : parseInt(battery, 10);
    const fenceValue =
        parkingFenceId === undefined || parkingFenceId === null || parkingFenceId === ''
            ? null
            : parseInt(parkingFenceId, 10);

    const locationWkt = buildLocationWkt(longitude, latitude);

    const res = await pool.query(
        `UPDATE vehicles
     SET
       code = $2,
       park_id = $3,
       battery = COALESCE($4::integer, battery),
       location = CASE
         WHEN $5 IS NULL THEN location
         ELSE ST_SetSRID(ST_GeomFromText($5::text), 4326)
       END,
       parking_fence_id = $6,
       updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       code,
       status,
       battery,
       park_id,
       parking_fence_id,
       ST_X(location::geometry) AS longitude,
       ST_Y(location::geometry) AS latitude`,
        [id, code, parkId, batteryValue, locationWkt, fenceValue]
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
     RETURNING
       id,
       code,
       status,
       battery,
       park_id,
       parking_fence_id,
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
    await pool.query('DELETE FROM vehicles WHERE id = $1');
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
