/**
 * Simple taxi pricing and travel time estimation.
 * All numbers come from config.pricing / config.routing so the values
 * only exist in one place.
 *
 *   price    = BASE_FARE + distanceKm * PRICE_PER_KM
 *   duration = distanceKm / AVERAGE_SPEED_KMH  (in minutes)
 */
const config = require('../config');

/** Rounds an amount to the configured step (e.g. to the nearest 1000 Toman). */
function roundPrice(amount) {
  const step = config.pricing.ROUND_TO;
  return Math.round(amount / step) * step;
}

/** Final price in Toman for a route of the given length. */
function calculatePrice(distanceKm) {
  const km = Math.max(0, Number(distanceKm) || 0);
  return roundPrice(config.pricing.BASE_FARE + km * config.pricing.PRICE_PER_KM);
}

/** Estimated travel time in whole minutes (at least 1 minute). */
function calculateDuration(distanceKm) {
  const km = Math.max(0, Number(distanceKm) || 0);
  const hours = km / config.routing.AVERAGE_SPEED_KMH;
  return Math.max(1, Math.round(hours * 60));
}

/** Both estimates together, for a route result. */
function estimateRide(distanceKm) {
  return {
    distanceKm,
    durationMin: calculateDuration(distanceKm),
    price: calculatePrice(distanceKm),
  };
}

module.exports = { calculatePrice, calculateDuration, estimateRide, roundPrice };
