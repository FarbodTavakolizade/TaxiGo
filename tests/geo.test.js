// Tests for the geographic helpers (src/utils/geo.js).
const { haversineDistanceKm, isValidCoordinates, roundTo } = require('../src/utils/geo');

describe('haversine distance', () => {
  test('is zero for identical points', () => {
    expect(haversineDistanceKm(35.7, 51.4, 35.7, 51.4)).toBeCloseTo(0, 5);
  });

  test('matches the known distance between Azadi Square and Tajrish (~14.5 km)', () => {
    // Known straight-line distance between the two Tehran squares.
    const km = haversineDistanceKm(35.6997, 51.338, 35.804, 51.434);
    expect(km).toBeGreaterThan(14);
    expect(km).toBeLessThan(15);
  });

  test('is symmetric (A to B equals B to A)', () => {
    const forward = haversineDistanceKm(35.6997, 51.338, 35.804, 51.434);
    const backward = haversineDistanceKm(35.804, 51.434, 35.6997, 51.338);
    expect(forward).toBeCloseTo(backward, 10);
  });

  test('matches a known long distance (Tehran to Shiraz, ~700 km)', () => {
    const km = haversineDistanceKm(35.6892, 51.389, 29.5918, 52.5837);
    expect(km).toBeGreaterThan(680);
    expect(km).toBeLessThan(720);
  });
});

describe('coordinate validation', () => {
  test('accepts valid Tehran coordinates', () => {
    expect(isValidCoordinates(35.7, 51.4)).toBe(true);
  });

  test('rejects out-of-range latitude and longitude', () => {
    expect(isValidCoordinates(120, 51.4)).toBe(false);
    expect(isValidCoordinates(35.7, 200)).toBe(false);
  });

  test('rejects non-numeric values', () => {
    expect(isValidCoordinates(NaN, 51.4)).toBe(false);
    expect(isValidCoordinates(35.7, undefined)).toBe(false);
  });
});

describe('roundTo', () => {
  test('rounds to one decimal by default', () => {
    expect(roundTo(8.44)).toBe(8.4);
    expect(roundTo(8.46)).toBe(8.5);
  });
});
