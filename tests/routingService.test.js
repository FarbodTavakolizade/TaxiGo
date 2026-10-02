// Tests for the Dijkstra shortest path and the route calculation.
const routingService = require('../src/services/routingService');
const { TEHRAN_NODES } = require('../src/data/tehranGraph');

describe('dijkstra shortest path', () => {
  test('finds the direct path between connected nodes', () => {
    const result = routingService.dijkstra('azadi', 'sadeghieh');
    expect(result).not.toBeNull();
    expect(result.nodeIds).toEqual(['azadi', 'sadeghieh']);
    expect(result.distanceKm).toBe(2.5);
  });

  test('chooses the shortest of several options (Vanak to Azadi)', () => {
    // Direct edge does not exist; the shortest path is
    // Vanak -> Sadeghieh -> Azadi (8.5 + 2.5 = 11 km), which is shorter
    // than Vanak -> Valiasr -> Enghelab -> Azadi (5.5 + 2 + 6.5 = 14 km).
    const result = routingService.dijkstra('vanak', 'azadi');
    expect(result).not.toBeNull();
    expect(result.distanceKm).toBe(11);
    expect(result.nodeIds).toEqual(['vanak', 'sadeghieh', 'azadi']);
  });

  test('returns a path to the same node with zero distance', () => {
    const result = routingService.dijkstra('vanak', 'vanak');
    expect(result.distanceKm).toBe(0);
    expect(result.nodeIds).toEqual(['vanak']);
  });

  test('returns null for unknown nodes', () => {
    expect(routingService.dijkstra('vanak', 'does-not-exist')).toBeNull();
  });
});

describe('graph integrity', () => {
  test('every edge points to an existing node', () => {
    const ids = new Set(TEHRAN_NODES.map((node) => node.id));
    for (const edge of routingService.TEHRAN_EDGES) {
      expect(ids.has(edge.from)).toBe(true);
      expect(ids.has(edge.to)).toBe(true);
      expect(edge.km).toBeGreaterThan(0);
    }
  });

  test('no node is unreachable from the graph centre', () => {
    for (const node of TEHRAN_NODES) {
      expect(routingService.dijkstra('enghelab', node.id)).not.toBeNull();
    }
  });
});

describe('findNearestNode', () => {
  test('snaps Azadi coordinates to the Azadi node', () => {
    const nearest = routingService.findNearestNode(35.6997, 51.338);
    expect(nearest.node.id).toBe('azadi');
    expect(nearest.distanceKm).toBeLessThan(0.1);
  });

  test('snaps a point between squares to the closest one', () => {
    // Slightly north of Azadi, closer to Azadi than to Sadeghieh.
    const nearest = routingService.findNearestNode(35.7020, 51.3380);
    expect(nearest.node.id).toBe('azadi');
  });
});

describe('calculateRoute', () => {
  const azadi = { originLat: 35.6997, originLng: 51.338 };
  const tajrish = { destinationLat: 35.804, destinationLng: 51.434 };

  test('returns a graph route with distance, nodes and polyline', () => {
    const route = routingService.calculateRoute({ ...azadi, ...tajrish });

    expect(route.usedFallback).toBe(false);
    expect(route.distanceKm).toBeGreaterThan(0);
    expect(route.path.length).toBeGreaterThanOrEqual(2);
    expect(route.nodes.length).toBeGreaterThan(0);
    expect(route.nodes[0].name).toBe('Azadi Square');
    expect(route.nodes[route.nodes.length - 1].name).toBe('Tajrish Square');
  });

  test('polyline starts at the exact origin and ends at the exact destination', () => {
    const route = routingService.calculateRoute({ ...azadi, ...tajrish });

    expect(route.path[0]).toEqual({ lat: 35.6997, lng: 51.338 });
    expect(route.path[route.path.length - 1]).toEqual({ lat: 35.804, lng: 51.434 });
  });

  test('falls back to straight-line distance for points far outside the graph', () => {
    // Shiraz is ~690 km from Tehran, far beyond the simplified graph.
    const route = routingService.calculateRoute({
      originLat: 29.5918, originLng: 52.5837,
      destinationLat: 35.6997, destinationLng: 51.338,
    });

    expect(route.usedFallback).toBe(true);
    expect(route.distanceKm).toBeGreaterThan(600);
    expect(route.nodes).toEqual([]);
  });

  test('rejects invalid coordinates instead of crashing', () => {
    expect(() => routingService.calculateRoute({
      originLat: 'not-a-number', originLng: 51.338,
      destinationLat: 35.804, destinationLng: 51.434,
    })).toThrow('Origin coordinates are missing or invalid.');

    expect(() => routingService.calculateRoute({
      originLat: 35.6997, originLng: 51.338,
      destinationLat: null, destinationLng: undefined,
    })).toThrow('Destination coordinates are missing or invalid.');
  });

  test('rejects out-of-range coordinates', () => {
    expect(() => routingService.calculateRoute({
      originLat: 200, originLng: 51.338,
      destinationLat: 35.804, destinationLng: 51.434,
    })).toThrow();
  });
});
