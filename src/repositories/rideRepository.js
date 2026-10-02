// Database access for the rides table.
// All queries are parameterized ($1, $2, ...) - never built by string
// concatenation.
const pool = require('../db/pool');

// Shared SELECT with passenger and driver names, used by every read query.
const RIDE_SELECT = `
  SELECT r.id, r.passenger_id, r.driver_id, r.origin, r.destination,
         r.status, r.created_at, r.accepted_at, r.started_at,
         r.completed_at, r.cancelled_at,
         p.name AS passenger_name,
         d.name AS driver_name
  FROM rides r
  JOIN users p ON p.id = r.passenger_id
  LEFT JOIN users d ON d.id = r.driver_id
`;

async function createRide({ passengerId, origin, destination }) {
  const result = await pool.query(
    `INSERT INTO rides (passenger_id, origin, destination)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [passengerId, origin, destination]
  );
  return findById(result.rows[0].id);
}

async function findById(id) {
  const result = await pool.query(`${RIDE_SELECT} WHERE r.id = $1`, [id]);
  return result.rows[0] || null;
}

/** All rides of one passenger, newest first. */
async function findByPassenger(passengerId) {
  const result = await pool.query(
    `${RIDE_SELECT} WHERE r.passenger_id = $1 ORDER BY r.created_at DESC`,
    [passengerId]
  );
  return result.rows;
}

/** The most recent rides of one passenger (for the dashboard). */
async function findRecentByPassenger(passengerId, limit) {
  const result = await pool.query(
    `${RIDE_SELECT} WHERE r.passenger_id = $1
     ORDER BY r.created_at DESC LIMIT $2`,
    [passengerId, limit]
  );
  return result.rows;
}

/** Ride counts for the passenger dashboard. */
async function getPassengerStats(passengerId) {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('REQUESTED', 'ACCEPTED', 'STARTED')) AS current_rides,
       COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_rides
     FROM rides
     WHERE passenger_id = $1`,
    [passengerId]
  );
  return {
    currentRides: Number(result.rows[0].current_rides),
    completedRides: Number(result.rows[0].completed_rides),
  };
}

/** Rides waiting for a driver (used by the driver dashboard). */
async function findRequested() {
  const result = await pool.query(
    `${RIDE_SELECT} WHERE r.status = 'REQUESTED' ORDER BY r.created_at ASC`
  );
  return result.rows;
}

/** All rides of one driver, newest first. */
async function findByDriver(driverId) {
  const result = await pool.query(
    `${RIDE_SELECT} WHERE r.driver_id = $1 ORDER BY r.created_at DESC`,
    [driverId]
  );
  return result.rows;
}

/** The ride a driver is currently working on, if any. */
async function findActiveByDriver(driverId) {
  const result = await pool.query(
    `${RIDE_SELECT} WHERE r.driver_id = $1
       AND r.status IN ('ACCEPTED', 'STARTED')
     ORDER BY r.accepted_at DESC LIMIT 1`,
    [driverId]
  );
  return result.rows[0] || null;
}

/** Completed ride count for the driver dashboard. */
async function countCompletedByDriver(driverId) {
  const result = await pool.query(
    `SELECT COUNT(*) AS completed FROM rides
     WHERE driver_id = $1 AND status = 'COMPLETED'`,
    [driverId]
  );
  return Number(result.rows[0].completed);
}

/**
 * Atomically assigns a REQUESTED ride to a driver.
 * Returns the updated ride, or null when the ride was already taken
 * (two drivers accepting at the same time must not both succeed).
 */
async function assignToDriverIfRequested(rideId, driverId) {
  const result = await pool.query(
    `UPDATE rides
     SET driver_id = $1, status = 'ACCEPTED', accepted_at = NOW()
     WHERE id = $2 AND status = 'REQUESTED' AND driver_id IS NULL
     RETURNING id`,
    [driverId, rideId]
  );
  if (result.rowCount === 0) return null;
  return findById(rideId);
}

/**
 * Atomically changes a ride status.
 * Only updates when the ride is in the expected status and (optionally)
 * belongs to the given driver. Returns the updated ride or null.
 */
async function updateStatus(rideId, fromStatus, toStatus, { driverId = null } = {}) {
  const timestampColumn = {
    ACCEPTED: 'accepted_at',
    STARTED: 'started_at',
    COMPLETED: 'completed_at',
    CANCELLED: 'cancelled_at',
  }[toStatus];

  const params = [toStatus, rideId, fromStatus];
  let driverFilter = '';
  if (driverId !== null) {
    params.push(driverId);
    driverFilter = ` AND driver_id = $${params.length}`;
  }

  const result = await pool.query(
    `UPDATE rides
     SET status = $1, ${timestampColumn} = NOW()
     WHERE id = $2 AND status = $3${driverFilter}
     RETURNING id`,
    params
  );
  if (result.rowCount === 0) return null;
  return findById(rideId);
}

module.exports = {
  createRide,
  findById,
  findByPassenger,
  findRecentByPassenger,
  getPassengerStats,
  findRequested,
  findByDriver,
  findActiveByDriver,
  countCompletedByDriver,
  assignToDriverIfRequested,
  updateStatus,
};
