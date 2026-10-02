/**
 * Business rules for rides: creating requests, the driver workflow and
 * cancellations. All ride status changes go through this service, which
 * enforces the allowed transitions from src/constants.js.
 */
const AppError = require('../errors');
const { RIDE_STATUS, ROLES, canTransition } = require('../constants');
const rideRepository = require('../repositories/rideRepository');
const routingService = require('./routingService');
const pricingService = require('./pricingService');
const driverService = require('./driverService');
const {
  validateRequired,
  validateMaxLength,
  firstError,
} = require('../utils/validators');

// ---------------------------------------------------------------------
// Passenger
// ---------------------------------------------------------------------

/**
 * A passenger creates a new taxi request (origin + destination).
 *
 * Two ways to request a ride:
 *  - with map coordinates: the route is calculated (Dijkstra), the price
 *    and duration are estimated, and the nearest available driver is
 *    assigned automatically (ride starts as ACCEPTED),
 *  - without coordinates: a plain text request as before (REQUESTED),
 *    which any driver can accept manually.
 */
async function requestRide(user, input) {
  if (user.role !== ROLES.PASSENGER) {
    throw new AppError(403, 'Only passengers can request a ride.');
  }

  const { origin, destination } = input;
  const error = firstError(
    validateRequired(origin, 'Origin'),
    validateMaxLength(origin, 'Origin', 200),
    validateRequired(destination, 'Destination'),
    validateMaxLength(destination, 'Destination', 200)
  );
  if (error) throw new AppError(400, error);

  const coordinates = readCoordinates(input);

  // Plain text request without a map selection.
  if (!coordinates) {
    const ride = await rideRepository.createRide({
      passengerId: user.id,
      origin: origin.trim(),
      destination: destination.trim(),
    });
    return { ride, assignment: null };
  }

  // Map request: route, estimates, then nearest driver.
  const route = routingService.calculateRoute(coordinates);
  const estimates = pricingService.estimateRide(route.distanceKm);
  const nearest = await driverService.findNearestAvailableDriver(
    coordinates.originLat,
    coordinates.originLng
  );

  const ride = await rideRepository.createRide({
    passengerId: user.id,
    origin: origin.trim(),
    destination: destination.trim(),
    originLat: coordinates.originLat,
    originLng: coordinates.originLng,
    destinationLat: coordinates.destinationLat,
    destinationLng: coordinates.destinationLng,
    distanceKm: estimates.distanceKm,
    estimatedDuration: estimates.durationMin,
    estimatedPrice: estimates.price,
    driverId: nearest ? nearest.driver.id : null,
  });

  return { ride, assignment: nearest };
}

/**
 * Reads the optional map coordinates from the request form.
 * Returns null when no coordinate was sent at all, throws when the
 * selection is incomplete.
 */
function readCoordinates(input) {
  const values = [
    input.originLat, input.originLng,
    input.destinationLat, input.destinationLng,
  ].map((value) => (value === undefined || value === null || value === '' ? null : value));

  const provided = values.filter((value) => value !== null);
  if (provided.length === 0) return null;

  if (provided.length < 4) {
    throw new AppError(400, 'Please select both origin and destination on the map.');
  }

  return {
    originLat: Number(values[0]),
    originLng: Number(values[1]),
    destinationLat: Number(values[2]),
    destinationLng: Number(values[3]),
  };
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
    throw new AppError(
      400,
      `Only a ride with status ${fromStatus} can be marked as ${toStatus}.`
    );
  }

  if (!canTransition(fromStatus, toStatus)) {
    throw new AppError(400, 'This status change is not allowed.');
  }

  return mustUpdate(rideId, fromStatus, toStatus, { driverId: user.id });
}

// ---------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------

/**
 * Ride details for the details page (passenger or assigned driver only).
 * Includes the assigned driver's simulated location when present.
 */
async function getRideDetails(user, rideId) {
  const ride = await requireRide(rideId);

  const isOwnerPassenger = ride.passenger_id === user.id && user.role === ROLES.PASSENGER;
  const isAssignedDriver = ride.driver_id === user.id && user.role === ROLES.DRIVER;

  if (!isOwnerPassenger && !isAssignedDriver) {
    throw new AppError(403, 'You do not have permission to view this ride.');
  }

  let driverLocation = null;
  if (ride.driver_id) {
    driverLocation = await driverService.getDriverLocation(ride.driver_id);
  }

  return { ride, driverLocation };
}

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
  getRideDetails,
};
