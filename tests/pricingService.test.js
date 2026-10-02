// Tests for the pricing and travel time estimation (src/services/pricingService.js).
const config = require('../src/config');
const pricingService = require('../src/services/pricingService');

const { BASE_FARE, PRICE_PER_KM } = config.pricing;
const { AVERAGE_SPEED_KMH } = config.routing;

describe('price calculation', () => {
  test('uses the documented formula: base fare + distance * price per km', () => {
    // 8.4 km -> 50000 + 84000 = 134000 Toman
    expect(pricingService.calculatePrice(8.4)).toBe(BASE_FARE + 8.4 * PRICE_PER_KM);
  });

  test('a zero distance ride costs exactly the base fare', () => {
    expect(pricingService.calculatePrice(0)).toBe(BASE_FARE);
  });

  test('rounds the final amount to the configured step', () => {
    // 7.13 km -> 50000 + 71300 = 121300 -> rounded to 121000
    const price = pricingService.calculatePrice(7.13);
    expect(price % config.pricing.ROUND_TO).toBe(0);
    expect(price).toBe(121000);
  });

  test('treats negative or invalid distances as zero', () => {
    expect(pricingService.calculatePrice(-5)).toBe(BASE_FARE);
    expect(pricingService.calculatePrice('abc')).toBe(BASE_FARE);
  });

  test('price grows with distance', () => {
    expect(pricingService.calculatePrice(20)).toBeGreaterThan(pricingService.calculatePrice(5));
  });
});

describe('duration calculation', () => {
  test('uses the documented formula: distance / average speed', () => {
    // 15 km at 30 km/h = 30 minutes
    expect(pricingService.calculateDuration(15)).toBe(30);
  });

  test('rounds to whole minutes', () => {
    // 8.4 km at 30 km/h = 16.8 min -> 17
    expect(pricingService.calculateDuration(8.4)).toBe(17);
  });

  test('never returns less than one minute', () => {
    expect(pricingService.calculateDuration(0)).toBe(1);
  });
});

describe('estimateRide', () => {
  test('returns distance, duration and price together', () => {
    const estimate = pricingService.estimateRide(8.4);
    expect(estimate.distanceKm).toBe(8.4);
    expect(estimate.durationMin).toBe(17);
    expect(estimate.price).toBe(BASE_FARE + 8.4 * PRICE_PER_KM);
  });

  test('is consistent with the single-value helpers', () => {
    const estimate = pricingService.estimateRide(12.3);
    expect(estimate.price).toBe(pricingService.calculatePrice(12.3));
    expect(estimate.durationMin).toBe(pricingService.calculateDuration(12.3));
  });
});

describe('pricing configuration', () => {
  test('values live in config and are positive numbers', () => {
    expect(typeof BASE_FARE).toBe('number');
    expect(typeof PRICE_PER_KM).toBe('number');
    expect(BASE_FARE).toBeGreaterThan(0);
    expect(PRICE_PER_KM).toBeGreaterThan(0);
    expect(AVERAGE_SPEED_KMH).toBeGreaterThan(0);
  });
});
