/**
 * Driver lookup and the very simple driver assignment used by this project:
 * the available driver with the smallest straight-line (Haversine) distance
 * to the passenger's origin wins. No dispatching system, no scoring.
 */
const AppError = require('../errors');
const driverRepository = require('../repositories/driverRepository');
const { haversineDistanceKm, roundTo } = require('../utils/geo');

/**
 * All active drivers with their location and a small extra field telling
 * whether they are free (used_by_map = passenger map + admin pages).
 */
async function getDriversForMap() {
  const drivers = await driverRepository.findAllWithLocations();
  return drivers.map((driver) => ({
    id: driver.id,
    name: driver.name,
    area: driver.area,
    lat: Number(driver.lat),
    lng: Number(driver.lng),
    busy: driver.active_ride_id !== null,
  }));
}

/**
 * Nearest available driver to a coordinate.
 * @returns {{driver, distanceKm}|null} null when no driver is available.
 */
async function findNearestAvailableDriver(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new AppError(400, 'Origin coordinates are required to find a driver.');
  }

  const available = await driverRepository.findAvailableWithLocations();
  if (available.length === 0) return null;

  let nearest = null;
  let nearestKm = Infinity;

  for (const driver of available) {
    const km = haversineDistanceKm(lat, lng, Number(driver.lat), Number(driver.lng));
    if (km < nearestKm) {
      nearestKm = km;
      nearest = driver;
    }
  }

  return {
    driver: {
      id: nearest.id,
      name: nearest.name,
      area: nearest.area,
      lat: Number(nearest.lat),
      lng: Number(nearest.lng),
    },
    distanceKm: roundTo(nearestKm),
  };
}

/** Location of one driver (used by the driver dashboard map). */
async function getDriverLocation(driverId) {
  const location = await driverRepository.findLocationByDriver(driverId);
  if (!location) return null;
  return {
    area: location.area,
    lat: Number(location.lat),
    lng: Number(location.lng),
  };
}

module.exports = {
  getDriversForMap,
  findNearestAvailableDriver,
  getDriverLocation,
};
