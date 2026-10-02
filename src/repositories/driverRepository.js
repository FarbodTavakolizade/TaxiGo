// Database access for driver locations and driver availability.
const pool = require('../db/pool');

/**
 * All active drivers with their simulated location, plus the ride they are
 * currently working on (if any).
 */
async function findAllWithLocations() {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.is_active,
            l.area, l.lat, l.lng,
            r.id     AS active_ride_id,
            r.status AS active_ride_status
     FROM users u
     JOIN driver_locations l ON l.driver_id = u.id
     LEFT JOIN rides r
       ON r.driver_id = u.id AND r.status IN ('ACCEPTED', 'STARTED')
     WHERE u.role = 'DRIVER' AND u.is_active = TRUE
     ORDER BY u.id`
  );
  return result.rows;
}

/**
 * Drivers that could take a new ride right now:
 * active, with a known location and without an active ride.
 */
async function findAvailableWithLocations() {
  const result = await pool.query(
    `SELECT u.id, u.name, l.area, l.lat, l.lng
     FROM users u
     JOIN driver_locations l ON l.driver_id = u.id
     WHERE u.role = 'DRIVER'
       AND u.is_active = TRUE
       AND NOT EXISTS (
         SELECT 1 FROM rides r
         WHERE r.driver_id = u.id AND r.status IN ('ACCEPTED', 'STARTED')
       )
     ORDER BY u.id`
  );
  return result.rows;
}

/** The simulated location of one driver, or null when not set. */
async function findLocationByDriver(driverId) {
  const result = await pool.query(
    `SELECT l.area, l.lat, l.lng
     FROM driver_locations l
     WHERE l.driver_id = $1`,
    [driverId]
  );
  return result.rows[0] || null;
}

module.exports = {
  findAllWithLocations,
  findAvailableWithLocations,
  findLocationByDriver,
};
