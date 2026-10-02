/**
 * Shared constants for roles and ride statuses, plus the single place
 * where the allowed ride status transitions are defined.
 */

const ROLES = {
  PASSENGER: 'PASSENGER',
  DRIVER: 'DRIVER',
  ADMIN: 'ADMIN',
};

const RIDE_STATUS = {
  REQUESTED: 'REQUESTED',
  ACCEPTED: 'ACCEPTED',
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// Allowed transitions (see project specification section 3):
//   REQUESTED -> ACCEPTED / CANCELLED
//   ACCEPTED  -> STARTED / CANCELLED
//   STARTED   -> COMPLETED
const ALLOWED_TRANSITIONS = {
  [RIDE_STATUS.REQUESTED]: [RIDE_STATUS.ACCEPTED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.ACCEPTED]: [RIDE_STATUS.STARTED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.STARTED]: [RIDE_STATUS.COMPLETED],
  [RIDE_STATUS.COMPLETED]: [],
  [RIDE_STATUS.CANCELLED]: [],
};

/** Returns true when a ride may move from one status to another. */
function canTransition(fromStatus, toStatus) {
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
}

module.exports = { ROLES, RIDE_STATUS, ALLOWED_TRANSITIONS, canTransition };
