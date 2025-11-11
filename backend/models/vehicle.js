// backend/models/vehicle.js
const pool = require('../config/db');

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

module.exports = { getAllVehicles };
