/**
 * Small JSON API used by the map pages (plain HTTP requests from
 * public/js/map.js - no WebSockets, no polling framework).
 */
const AppError = require('../errors');
const routingService = require('../services/routingService');
const pricingService = require('../services/pricingService');
const driverService = require('../services/driverService');
const rideService = require('../services/rideService');

/**
 * POST /api/route  { originLat, originLng, destinationLat, destinationLng }
 * Calculates the shortest route (Dijkstra) and the price/time estimates.
 */
function calculateRoute(req, res) {
  const { originLat, originLng, destinationLat, destinationLng } = req.body;

  const route = routingService.calculateRoute({
    originLat, originLng, destinationLat, destinationLng,
  });
  const estimates = pricingService.estimateRide(route.distanceKm);

  res.json({
    distanceKm: estimates.distanceKm,
    durationMin: estimates.durationMin,
    price: estimates.price,
    path: route.path,
    nodes: route.nodes,
    usedFallback: route.usedFallback,
  });
}

/** GET /api/drivers - simulated driver locations for the map. */
async function listDrivers(req, res) {
  const drivers = await driverService.getDriversForMap();
  res.json({ drivers });
}

/** Reference points of the simplified road graph (optional debugging view). */
function listGraphNodes(req, res) {
  res.json({
    nodes: routingService.TEHRAN_NODES,
    edges: routingService.TEHRAN_EDGES,
  });
}

/**
 * GET /api/rides/:id - current state of one ride.
 * Used by the passenger and driver pages to refresh the status without
 * reloading the whole page.
 */
async function getRide(req, res) {
  const { ride, driverLocation } = await rideService.getRideDetails(
    req.session.user,
    req.params.id
  );

  res.json({
    id: ride.id,
    status: ride.status,
    origin: ride.origin,
    destination: ride.destination,
    originLat: ride.origin_lat,
    originLng: ride.origin_lng,
    destinationLat: ride.destination_lat,
    destinationLng: ride.destination_lng,
    distanceKm: ride.distance_km,
    estimatedDuration: ride.estimated_duration,
    estimatedPrice: ride.estimated_price,
    driverName: ride.driver_name,
    driverLocation,
  });
}

module.exports = { calculateRoute, listDrivers, listGraphNodes, getRide };
