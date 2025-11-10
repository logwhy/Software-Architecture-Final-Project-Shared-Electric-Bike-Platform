const pool = require('../config/db');

// 新增投诉
const createComplaint = async ({ type, description, photoUrl, longitude, latitude }) => {
  const res = await pool.query(
    `INSERT INTO complaints (type, description, photo_url, location, status, created_at)
     VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), '未处理', NOW())
     RETURNING *`,
    [type, description, photoUrl, longitude, latitude]
  );
  return res.rows[0];
};

// 获取所有投诉
const getComplaints = async () => {
  const res = await pool.query(
    `SELECT id, type, description, photo_url, status, created_at, handled_at, handler,
     ST_X(location) AS longitude, ST_Y(location) AS latitude
     FROM complaints ORDER BY created_at DESC`
  );
  return res.rows;
};

// 处理投诉
const handleComplaint = async (id, handler) => {
  const res = await pool.query(
    `UPDATE complaints SET status='已处理', handled_at=NOW(), handler=$2 WHERE id=$1 RETURNING *`,
    [id, handler]
  );
  return res.rows[0];
};

module.exports = { createComplaint, getComplaints, handleComplaint };
