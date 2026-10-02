/**
 * Business rules for rides: creating requests, the driver workflow and
 * cancellations. All ride status changes go through this service, which
 * enforces the allowed transitions from src/constants.js.
 */
const AppError = require('../errors');
const { RIDE_STATUS, ROLES, canTransition } = require('../constants');
const rideRepository = require('../repositories/rideRepository');
const {
  validateRequired,
  validateMaxLength,
  firstError,
} = require('../utils/validators');

// ---------------------------------------------------------------------
// Passenger
// ---------------------------------------------------------------------

/** A passenger creates a new taxi request (origin + destination). */
async function requestRide(user, { origin, destination }) {
  if (user.role !== ROLES.PASSENGER) {
    throw new AppError(403, 'Only passengers can request a ride.');
  }

  const error = firstError(
    validateRequired(origin, 'Origin'),
    validateMaxLength(origin, 'Origin', 200),
    validateRequired(destination, 'Destination'),
    validateMaxLength(destination, 'Destination', 200)
  );
  if (error) throw new AppError(400, error);

  return rideRepository.createRide({
    passengerId: user.id,
    origin: origin.trim(),
    destination: destination.trim(),
  });
}

async function getPassengerRides(passengerId) {
  return rideRepository.findByPassenger(passengerId);
}

async function getPassengerDashboard(passengerId) {
  const [stats, recentRides] = await Promise.all([
    rideRepository.getPassengerStats(passengerId),
    rideRepository.findRecentByPassenger(passengerId, 5),
  ]);
  return { ...stats, recentRides };
}

/** Passenger cancels their own ride, but only before it has started. */
async function cancelByPassenger(user, rideId) {
  const ride = await requireRide(rideId);

  if (ride.passenger_id !== user.id) {
    throw new AppError(403, 'You can only cancel your own rides.');
  }

  if (!canTransition(ride.status, RIDE_STATUS.CANCELLED)) {
    throw new AppError(
      400,
      'This ride can no longer be cancelled because it has already started.'
    );
  }

  return mustUpdate(rideId, ride.status, RIDE_STATUS.CANCELLED);
}

// ---------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------

/** Rides still waiting for a driver. */
async function getAvailableRides() {
  return rideRepository.findRequested();
}

async function getDriverDashboard(driverId) {
  const [availableRides, activeRide, completedRides] = await Promise.all([
    rideRepository.findRequested(),
    rideRepository.findActiveByDriver(driverId),
    rideRepository.countCompletedByDriver(driverId),
  ]);
  return { availableRides, activeRide, completedRides };
}

async function getDriverRides(driverId) {
  return rideRepository.findByDriver(driverId);
}

/** Driver accepts a REQUESTED ride. */
async function acceptRide(user, rideId) {
  if (user.role !== ROLES.DRIVER) {
    throw new AppError(403, 'Only drivers can accept rides.');
  }

  const ride = await requireRide(rideId);

  if (ride.status !== RIDE_STATUS.REQUESTED) {
    throw new AppError(400, 'This ride is no longer available.');
  }

  // Atomic update: if another driver accepted first, this returns null.
  const updated = await rideRepository.assignToDriverIfRequested(rideId, user.id);
  if (!updated) {
    throw new AppError(400, 'This ride was just accepted by another driver.');
  }
  return updated;
}

/** Driver starts an ACCEPTED ride that belongs to them. */
async function startRide(user, rideId) {
  return driverTransition(user, rideId, RIDE_STATUS.ACCEPTED, RIDE_STATUS.STARTED);
}

/** Driver completes a STARTED ride that belongs to them. */
async function completeRide(user, rideId) {
  return driverTransition(user, rideId, RIDE_STATUS.STARTED, RIDE_STATUS.COMPLETED);
}

/** Driver cancels an ACCEPTED ride that belongs to them. */
async function cancelByDriver(user, rideId) {
  return driverTransition(user, rideId, RIDE_STATUS.ACCEPTED, RIDE_STATUS.CANCELLED);
}

/** Shared logic for STARTED / COMPLETED / CANCELLED transitions by a driver. */
async function driverTransition(user, rideId, fromStatus, toStatus) {
  if (user.role !== ROLES.DRIVER) {
    throw new AppError(403, 'Only drivers can do this.');
  }

  const ride = await requireRide(rideId);

  if (ride.driver_id !== user.id) {
    throw new AppError(403, 'This ride is assigned to another driver.');
  }

  if (ride.status !== fromStatus) {
    throw new AppError(400, `Only a ${fromStatus.toLowerCase()} ride can be marked as ${toStatus.toLowerCase()}.`);
  }

  if (!canTransition(fromStatus, toStatus)) {
    throw new AppError(400, 'This status change is not allowed.');
  }

  return mustUpdate(rideId, fromStatus, toStatus, { driverId: user.id });
}

// ---------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------

async function requireRide(rideId) {
  const id = Number(rideId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(404, 'Ride not found.');
  }

  const ride = await rideRepository.findById(id);
  if (!ride) throw new AppError(404, 'Ride not found.');
  return ride;
}

/** Runs the atomic status update and turns "0 rows" into a friendly error. */
async function mustUpdate(rideId, fromStatus, toStatus, options) {
  const updated = await rideRepository.updateStatus(rideId, fromStatus, toStatus, options);
  if (!updated) {
    throw new AppError(400, 'The ride status changed in the meantime. Please refresh the page.');
  }
  return updated;
}

module.exports = {
  requestRide,
  getPassengerRides,
  getPassengerDashboard,
  cancelByPassenger,
  getAvailableRides,
  getDriverDashboard,
  getDriverRides,
  acceptRide,
  startRide,
  completeRide,
  cancelByDriver,
};
