// Tests for the driver services and nearest-driver selection
// (src/services/driverService.js). The repository is mocked.
jest.mock('../src/repositories/driverRepository');

const driverRepository = require('../src/repositories/driverRepository');
const driverService = require('../src/services/driverService');

const AVAILABLE_DRIVERS = [
  { id: 2, name: 'Reza', area: 'Vanak',     lat: 35.7575, lng: 51.41 },
  { id: 5, name: 'Amir', area: 'Azadi',     lat: 35.6997, lng: 51.338 },
  { id: 6, name: 'Neda', area: 'Sadeghieh', lat: 35.71,   lng: 51.33 },
];

afterEach(() => {
  jest.clearAllMocks();
});

describe('nearest driver selection', () => {
  test('picks the driver closest to the passenger origin', async () => {
    driverRepository.findAvailableWithLocations.mockResolvedValue(AVAILABLE_DRIVERS);

    // Passenger is at Azadi Square -> Amir (Azadi) is nearest.
    const result = await driverService.findNearestAvailableDriver(35.6997, 51.338);

    expect(result.driver.id).toBe(5);
    expect(result.driver.name).toBe('Amir');
    expect(result.distanceKm).toBeLessThan(0.5);
  });

  test('picks a different driver for a different origin', async () => {
    driverRepository.findAvailableWithLocations.mockResolvedValue(AVAILABLE_DRIVERS);

    // Passenger is at Tajrish (north) -> Reza (Vanak) is the nearest of the three.
    const result = await driverService.findNearestAvailableDriver(35.804, 51.434);

    expect(result.driver.id).toBe(2);
  });

  test('returns null when no driver is available', async () => {
    driverRepository.findAvailableWithLocations.mockResolvedValue([]);

    const result = await driverService.findNearestAvailableDriver(35.7, 51.4);

    expect(result).toBeNull();
  });

  test('rejects invalid coordinates instead of picking a random driver', async () => {
    await expect(
      driverService.findNearestAvailableDriver(NaN, 51.4)
    ).rejects.toThrow('Origin coordinates are required to find a driver.');
    expect(driverRepository.findAvailableWithLocations).not.toHaveBeenCalled();
  });
});

describe('driver map data', () => {
  test('marks drivers with an active ride as busy', async () => {
    driverRepository.findAllWithLocations.mockResolvedValue([
      { id: 2, name: 'Reza', area: 'Vanak', lat: 35.7575, lng: 51.41, active_ride_id: null },
      { id: 3, name: 'Sara', area: 'Tajrish', lat: 35.804, lng: 51.434, active_ride_id: 9 },
    ]);

    const drivers = await driverService.getDriversForMap();

    expect(drivers[0].busy).toBe(false);
    expect(drivers[1].busy).toBe(true);
  });

  test('converts numeric text from the database into numbers', async () => {
    driverRepository.findAllWithLocations.mockResolvedValue([
      { id: 2, name: 'Reza', area: 'Vanak', lat: '35.7575', lng: '51.41', active_ride_id: null },
    ]);

    const drivers = await driverService.getDriversForMap();

    expect(drivers[0].lat).toBe(35.7575);
    expect(typeof drivers[0].lat).toBe('number');
  });

  test('driver location lookup returns null when not set', async () => {
    driverRepository.findLocationByDriver.mockResolvedValue(null);
    expect(await driverService.getDriverLocation(99)).toBeNull();
  });
});
