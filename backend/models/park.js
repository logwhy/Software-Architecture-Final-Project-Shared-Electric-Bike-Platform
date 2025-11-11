// backend/models/park.js
const pool = require('../config/db');

// 获取所有园区（包含边界信息）
const getAllParks = async () => {
    const res = await pool.query(`
        SELECT
            id,
            name,
            location,
            center_lng,
            center_lat,
            boundary_coordinates,
            created_at
        FROM parks
    `);
    return res.rows;
};

// 根据管理员ID获取管理的园区
const getParksByManagerId = async (userId) => {
    const res = await pool.query(`
        SELECT
            p.id,
            p.name,
            p.location,
            p.center_lng,
            p.center_lat,
            p.boundary_coordinates,
            p.created_at
        FROM parks p
                 INNER JOIN user_parks up ON p.id = up.park_id
        WHERE up.user_id = $1
    `, [userId]);
    return res.rows;
};

// 获取用户有权限访问的园区
const getParksByUser = async (userId, userRole) => {
    if (userRole === 'ADMIN') {
        return await getAllParks();
    } else if (userRole === 'MANAGER') {
        return await getParksByManagerId(userId);
    } else {
        return await getAllParks();
    }
};

module.exports = {
    getAllParks,
    getParksByManagerId,
    getParksByUser
};
