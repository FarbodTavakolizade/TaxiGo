/**
 * Route calculation for the taxi project.
 *
 * The route is found with Dijkstra's shortest path algorithm on the small
 * Tehran road graph in src/data/tehranGraph.js:
 *
 *   origin ----------► nearest graph node
 *                          │
 *                    Dijkstra over the graph
 *                          │
 *   destination ◄----- nearest graph node
 *
 * When the selected points are far outside the simplified graph (or the
 * graph has no connection), the service falls back to the straight-line
 * Haversine distance instead of failing.
 */
const config = require('../config');
const AppError = require('../errors');
const { TEHRAN_NODES, TEHRAN_EDGES } = require('../data/tehranGraph');
const { haversineDistanceKm, roundTo, isValidCoordinates } = require('../utils/geo');

// Adjacency list built once from the edge list: nodeId -> [{ to, km }]
const ADJACENCY = buildAdjacencyList();

function buildAdjacencyList() {
  const list = new Map();
  for (const node of TEHRAN_NODES) list.set(node.id, []);

  for (const edge of TEHRAN_EDGES) {
    list.get(edge.from).push({ to: edge.to, km: edge.km });
    list.get(edge.to).push({ to: edge.from, km: edge.km }); // roads go both ways
  }
  return list;
}

function getNode(nodeId) {
  return TEHRAN_NODES.find((node) => node.id === nodeId) || null;
}

/** Nearest graph node to a coordinate, with its distance in km. */
function findNearestNode(lat, lng) {
  let nearest = null;
  let nearestKm = Infinity;

  for (const node of TEHRAN_NODES) {
    const km = haversineDistanceKm(lat, lng, node.lat, node.lng);
    if (km < nearestKm) {
      nearestKm = km;
      nearest = node;
    }
  }

  return { node: nearest, distanceKm: nearestKm };
}

/**
 * Dijkstra's shortest path algorithm.
 * Returns { distanceKm, nodeIds } where nodeIds is the shortest path
 * from startId to endId, or null when no path exists.
 *
 * The graph is tiny (13 nodes), so a simple "pick the nearest unvisited
 * node" loop is used instead of a binary heap. This keeps the code easy
 * to read and explain.
 */
function dijkstra(startId, endId) {
  // Both nodes must exist in the graph, otherwise there is no route.
  if (!getNode(startId) || !getNode(endId)) return null;

  const distances = new Map(); // nodeId -> best known distance from start
  const previous = new Map();  // nodeId -> previous node on the best path
  const visited = new Set();

  for (const node of TEHRAN_NODES) distances.set(node.id, Infinity);
  distances.set(startId, 0);

  while (true) {
    // 1. Pick the unvisited node with the smallest known distance.
    let current = null;
    let currentDistance = Infinity;
    for (const [nodeId, distance] of distances) {
      if (!visited.has(nodeId) && distance < currentDistance) {
        current = nodeId;
        currentDistance = distance;
      }
    }

    if (current === null) break;      // remaining nodes are unreachable
    if (current === endId) break;     // reached the destination
    visited.add(current);

    // 2. Relax the neighbours of the current node.
    for (const edge of ADJACENCY.get(current)) {
      if (visited.has(edge.to)) continue;

      const candidate = currentDistance + edge.km;
      if (candidate < distances.get(edge.to)) {
        distances.set(edge.to, candidate);
        previous.set(edge.to, current);
      }
    }
  }

  if (distances.get(endId) === Infinity) return null; // no path

  // 3. Walk the previous links back to build the path.
  const nodeIds = [];
  let step = endId;
  while (step) {
    nodeIds.unshift(step);
    step = previous.get(step);
  }

  return { distanceKm: distances.get(endId), nodeIds };
}

/**
 * Calculates the route between two coordinates.
 *
 * Returns:
 *   distanceKm   - total route distance (graph path + walking parts)
 *   durationMin  - not included here; see pricingService
 *   path         - polyline points [{lat, lng}, ...] for Leaflet
 *   nodes        - graph nodes on the shortest path
 *   usedFallback - true when the straight-line distance was used
 *
 * Throws AppError(400) when a coordinate is missing or invalid.
 */
function calculateRoute({ originLat, originLng, destinationLat, destinationLng }) {
  const origin = toCoordinate(originLat, originLng, 'Origin');
  const destination = toCoordinate(destinationLat, destinationLng, 'Destination');

  const originSnap = findNearestNode(origin.lat, origin.lng);
  const destinationSnap = findNearestNode(destination.lat, destination.lng);

  const maxSnap = config.routing.MAX_SNAP_DISTANCE_KM;
  const outsideGraph =
    originSnap.distanceKm > maxSnap || destinationSnap.distanceKm > maxSnap;

  let graphPath = null;
  if (!outsideGraph) {
    graphPath = dijkstra(originSnap.node.id, destinationSnap.node.id);
  }

  // Straight-line fallback when the points are outside the graph or when
  // the two snapped nodes are not connected.
  if (!graphPath) {
    const straightKm = haversineDistanceKm(
      origin.lat, origin.lng, destination.lat, destination.lng
    );
    return {
      distanceKm: roundTo(straightKm),
      path: [origin, destination],
      nodes: [],
      usedFallback: true,
    };
  }

  const pathNodes = graphPath.nodeIds.map(getNode);
  const totalKm =
    originSnap.distanceKm + graphPath.distanceKm + destinationSnap.distanceKm;

  return {
    distanceKm: roundTo(totalKm),
    path: [origin, ...pathNodes.map((n) => ({ lat: n.lat, lng: n.lng })), destination],
    nodes: pathNodes.map((n) => ({ id: n.id, name: n.name, lat: n.lat, lng: n.lng })),
    usedFallback: false,
  };
}

function toCoordinate(lat, lng, label) {
  const numericLat = Number(lat);
  const numericLng = Number(lng);

  if (!isValidCoordinates(numericLat, numericLng)) {
    throw new AppError(400, `${label} coordinates are missing or invalid.`);
  }
  return { lat: numericLat, lng: numericLng };
}

module.exports = {
  calculateRoute,
  dijkstra,
  findNearestNode,
  getNode,
  TEHRAN_NODES,
  TEHRAN_EDGES,
};
