// Tests for the ride status transition rules (src/constants.js).
const { RIDE_STATUS, canTransition } = require('../src/constants');

describe('ride status transitions', () => {
  test('REQUESTED can move to ACCEPTED', () => {
    expect(canTransition(RIDE_STATUS.REQUESTED, RIDE_STATUS.ACCEPTED)).toBe(true);
  });

  test('REQUESTED can move to CANCELLED', () => {
    expect(canTransition(RIDE_STATUS.REQUESTED, RIDE_STATUS.CANCELLED)).toBe(true);
  });

  test('ACCEPTED can move to STARTED', () => {
    expect(canTransition(RIDE_STATUS.ACCEPTED, RIDE_STATUS.STARTED)).toBe(true);
  });

  test('ACCEPTED can move to CANCELLED', () => {
    expect(canTransition(RIDE_STATUS.ACCEPTED, RIDE_STATUS.CANCELLED)).toBe(true);
  });

  test('STARTED can move to COMPLETED', () => {
    expect(canTransition(RIDE_STATUS.STARTED, RIDE_STATUS.COMPLETED)).toBe(true);
  });

  test('COMPLETED is a final status', () => {
    expect(canTransition(RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED)).toBe(false);
    expect(canTransition(RIDE_STATUS.COMPLETED, RIDE_STATUS.STARTED)).toBe(false);
  });

  test('CANCELLED is a final status', () => {
    expect(canTransition(RIDE_STATUS.CANCELLED, RIDE_STATUS.ACCEPTED)).toBe(false);
    expect(canTransition(RIDE_STATUS.CANCELLED, RIDE_STATUS.STARTED)).toBe(false);
  });

  test('skipping a status is not allowed', () => {
    expect(canTransition(RIDE_STATUS.REQUESTED, RIDE_STATUS.STARTED)).toBe(false);
    expect(canTransition(RIDE_STATUS.REQUESTED, RIDE_STATUS.COMPLETED)).toBe(false);
    expect(canTransition(RIDE_STATUS.ACCEPTED, RIDE_STATUS.COMPLETED)).toBe(false);
  });
});
