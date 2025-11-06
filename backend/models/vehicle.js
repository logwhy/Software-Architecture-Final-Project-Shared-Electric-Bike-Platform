// backend/models/vehicle.js
const pool = require('../config/db');

const getAllVehicles = async () => {
    const res = await pool.query(`
        SELECT
            id, code, status, battery, park_id,
            ST_AsGeoJSON(location)::jsonb AS location_geojson
        FROM vehicles
        WHERE status != 'MAINTENANCE'
    `);

    return res.rows.map(row => ({
        ...row,
        location: row.location_geojson  // { type: "Point", coordinates: [lng, lat] }
    }));
};

module.exports = { getAllVehicles };
