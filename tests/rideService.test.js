// Tests for the ride business logic (src/services/rideService.js).
// The repository layer is mocked so the tests run without a database.
jest.mock('../src/repositories/rideRepository');

const rideRepository = require('../src/repositories/rideRepository');
const rideService = require('../src/services/rideService');
const { RIDE_STATUS, ROLES } = require('../src/constants');

const passenger = { id: 10, role: ROLES.PASSENGER, name: 'Test Passenger' };
const driver = { id: 20, role: ROLES.DRIVER, name: 'Test Driver' };
const otherDriver = { id: 21, role: ROLES.DRIVER, name: 'Other Driver' };

function makeRide(overrides = {}) {
  return {
    id: 1,
    passenger_id: passenger.id,
    driver_id: null,
    origin: 'A',
    destination: 'B',
    status: RIDE_STATUS.REQUESTED,
    ...overrides,
  };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('passenger creates a ride', () => {
  test('creates a ride with trimmed origin and destination', async () => {
    rideRepository.createRide.mockResolvedValue(makeRide());

    const ride = await rideService.requestRide(passenger, {
      origin: '  Azadi Square ',
      destination: ' Airport ',
    });

    expect(rideRepository.createRide).toHaveBeenCalledWith({
      passengerId: passenger.id,
      origin: 'Azadi Square',
      destination: 'Airport',
    });
    expect(ride.status).toBe(RIDE_STATUS.REQUESTED);
  });

  test('rejects an empty origin', async () => {
    await expect(
      rideService.requestRide(passenger, { origin: '   ', destination: 'B' })
    ).rejects.toThrow('Origin is required.');
    expect(rideRepository.createRide).not.toHaveBeenCalled();
  });

  test('rejects an empty destination', async () => {
    await expect(
      rideService.requestRide(passenger, { origin: 'A', destination: '' })
    ).rejects.toThrow('Destination is required.');
  });

  test('rejects a driver trying to request a ride', async () => {
    await expect(
      rideService.requestRide(driver, { origin: 'A', destination: 'B' })
    ).rejects.toThrow('Only passengers can request a ride.');
  });
});

describe('driver accepts a ride', () => {
  test('accepts a REQUESTED ride', async () => {
    rideRepository.findById.mockResolvedValue(makeRide());
    rideRepository.assignToDriverIfRequested.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.ACCEPTED, driver_id: driver.id })
    );

    const ride = await rideService.acceptRide(driver, 1);

    expect(ride.status).toBe(RIDE_STATUS.ACCEPTED);
    expect(ride.driver_id).toBe(driver.id);
  });

  test('rejects accepting a ride that is not REQUESTED', async () => {
    rideRepository.findById.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.ACCEPTED, driver_id: otherDriver.id })
    );

    await expect(rideService.acceptRide(driver, 1)).rejects.toThrow(
      'This ride is no longer available.'
    );
  });

  test('rejects when another driver accepted at the same moment', async () => {
    rideRepository.findById.mockResolvedValue(makeRide());
    // The atomic UPDATE returns no row when the ride was already taken.
    rideRepository.assignToDriverIfRequested.mockResolvedValue(null);

    await expect(rideService.acceptRide(driver, 1)).rejects.toThrow(
      'This ride was just accepted by another driver.'
    );
  });

  test('rejects a passenger trying to accept', async () => {
    await expect(rideService.acceptRide(passenger, 1)).rejects.toThrow(
      'Only drivers can accept rides.'
    );
  });
});

describe('driver starts and completes a ride', () => {
  test('starts an ACCEPTED ride that belongs to the driver', async () => {
    rideRepository.findById.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.ACCEPTED, driver_id: driver.id })
    );
    rideRepository.updateStatus.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.STARTED, driver_id: driver.id })
    );

    const ride = await rideService.startRide(driver, 1);
    expect(ride.status).toBe(RIDE_STATUS.STARTED);
  });

  test('completes a STARTED ride that belongs to the driver', async () => {
    rideRepository.findById.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.STARTED, driver_id: driver.id })
    );
    rideRepository.updateStatus.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.COMPLETED, driver_id: driver.id })
    );

    const ride = await rideService.completeRide(driver, 1);
    expect(ride.status).toBe(RIDE_STATUS.COMPLETED);
  });

  test('rejects completing a ride that is only ACCEPTED', async () => {
    rideRepository.findById.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.ACCEPTED, driver_id: driver.id })
    );

    await expect(rideService.completeRide(driver, 1)).rejects.toThrow(
      'Only a ride with status STARTED can be marked as COMPLETED.'
    );
    expect(rideRepository.updateStatus).not.toHaveBeenCalled();
  });

  test('rejects a driver starting another driver\'s ride', async () => {
    rideRepository.findById.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.ACCEPTED, driver_id: otherDriver.id })
    );

    await expect(rideService.startRide(driver, 1)).rejects.toThrow(
      'This ride is assigned to another driver.'
    );
  });
});

describe('passenger cancels a ride', () => {
  test('cancels a REQUESTED ride', async () => {
    rideRepository.findById.mockResolvedValue(makeRide());
    rideRepository.updateStatus.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.CANCELLED })
    );

    const ride = await rideService.cancelByPassenger(passenger, 1);
    expect(ride.status).toBe(RIDE_STATUS.CANCELLED);
  });

  test('rejects cancelling a STARTED ride', async () => {
    rideRepository.findById.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.STARTED, driver_id: driver.id })
    );

    await expect(rideService.cancelByPassenger(passenger, 1)).rejects.toThrow(
      'This ride can no longer be cancelled because it has already started.'
    );
  });

  test('rejects cancelling a ride that belongs to another passenger', async () => {
    rideRepository.findById.mockResolvedValue(makeRide({ passenger_id: 999 }));

    await expect(rideService.cancelByPassenger(passenger, 1)).rejects.toThrow(
      'You can only cancel your own rides.'
    );
  });
});

describe('invalid status transitions are rejected', () => {
  test('driver cannot cancel a STARTED ride', async () => {
    rideRepository.findById.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.STARTED, driver_id: driver.id })
    );

    await expect(rideService.cancelByDriver(driver, 1)).rejects.toThrow(
      'Only a ride with status ACCEPTED can be marked as CANCELLED.'
    );
  });

  test('missing ride returns a not found error', async () => {
    rideRepository.findById.mockResolvedValue(null);

    await expect(rideService.startRide(driver, 123)).rejects.toThrow(
      'Ride not found.'
    );
  });

  test('invalid ride id returns a not found error', async () => {
    await expect(rideService.acceptRide(driver, 'abc')).rejects.toThrow(
      'Ride not found.'
    );
  });
});

describe('driver dashboard data', () => {
  test('combines available rides, active ride and completed count', async () => {
    rideRepository.findRequested.mockResolvedValue([makeRide()]);
    rideRepository.findActiveByDriver.mockResolvedValue(
      makeRide({ status: RIDE_STATUS.STARTED, driver_id: driver.id })
    );
    rideRepository.countCompletedByDriver.mockResolvedValue(7);

    const data = await rideService.getDriverDashboard(driver.id);

    expect(data.availableRides).toHaveLength(1);
    expect(data.activeRide.status).toBe(RIDE_STATUS.STARTED);
    expect(data.completedRides).toBe(7);
  });
});
