// backend/models/vehicleTask.js
// This model provides functions for listing vehicles that are currently
// under maintenance and for recording the completion of a maintenance
// operation. When a maintainer submits a repair result, the vehicle’s
// status is reset to IDLE and its location is updated to the new
// coordinates. A record of the maintenance result is stored in the
// vehicle_tasks table to preserve a history of repairs.

const pool = require('../config/db');

/**
 * Get all vehicles currently marked as MAINTENANCE. Returns an array of
 * objects with the vehicle id, code and its longitude/latitude.  These
 * records are used by the maintainer front‑end to display a list of
 * vehicles that need to be repaired.
 * @returns {Promise<Array<{id:number, code:string, longitude:number, latitude:number}>>}
 */
const getMaintenanceVehicles = async () => {
    const res = await pool.query(
        `SELECT
            id,
            code,
            ST_X(location::geometry) AS longitude,
            ST_Y(location::geometry) AS latitude
        FROM vehicles
        WHERE status = 'MAINTENANCE'
        ORDER BY id`
    );
    return res.rows;
};

/**
 * Record the completion of a maintenance task and update the vehicle’s
 * status and location. A new row is inserted into vehicle_tasks with
 * details of the maintainer, result text, optional photo URL and
 * geolocation. The corresponding vehicle’s status is set back to IDLE
 * and its location updated to the supplied coordinates.
 *
 * @param {Object} params
 * @param {number} params.vehicleId        The id of the vehicle being repaired
 * @param {number} params.maintainerId     The id of the maintainer performing the repair
 * @param {string} params.resultText       Description of the maintenance process/result
 * @param {string|null} params.resultPhotoUrl Optional URL to an uploaded photo
 * @param {number} params.longitude        Longitude of the repair location
 * @param {number} params.latitude         Latitude of the repair location
 */
const completeTask = async ({
                                vehicleId,
                                maintainerId,
                                resultText,
                                resultPhotoUrl,
                                longitude,
                                latitude
                            }) => {
    // Insert a record into vehicle_tasks marking this maintenance as complete
    await pool.query(
        `INSERT INTO vehicle_tasks (
            vehicle_id,
            maintainer_id,
            status,
            result_text,
            result_photo_url,
            result_location,
            created_at,
            completed_at
        ) VALUES (
            $1,
            $2,
            '已完成',
            $3,
            $4,
            ST_SetSRID(ST_MakePoint($5, $6), 4326),
            NOW(),
            NOW()
        )`,
        [vehicleId, maintainerId, resultText, resultPhotoUrl, longitude, latitude]
    );

    // Update the vehicle record: set status back to IDLE and record its
    // updated location.  We set updated_at so that the timestamp reflects
    // when the maintenance was completed.
    await pool.query(
        `UPDATE vehicles
         SET status = 'IDLE',
             location = ST_SetSRID(ST_MakePoint($2, $3), 4326),
             updated_at = NOW()
         WHERE id = $1`,
        [vehicleId, longitude, latitude]
    );
};

module.exports = {
    getMaintenanceVehicles,
    completeTask
};