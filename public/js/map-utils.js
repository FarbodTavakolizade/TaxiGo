/**
 * Shared Leaflet helpers for the taxi map pages.
 *
 * Leaflet and OpenStreetMap are used for rendering only; all route
 * calculation happens on the server (routingService, Dijkstra) and the
 * browser gets the finished polyline from /api/route.
 *
 * Street data: (c) OpenStreetMap contributors (required attribution is
 * added to every map created here).
 */

const TEHRAN_CENTER = { lat: 35.7219, lng: 51.3995 };

/* eslint-disable no-unused-vars */
const TaxiMap = (() => {
  /** Creates a map with the OpenStreetMap attribution. */
  function createMap(elementId, options = {}) {
    const map = L.map(elementId, { zoomControl: true }).setView(
      [options.lat || TEHRAN_CENTER.lat, options.lng || TEHRAN_CENTER.lng],
      options.zoom || 11
    );

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Exposed for debugging in the browser console.
    window.taxiMap = map;
    return map;
  }

  /** Round colored marker used for origin / destination / driver. */
  function pinIcon(className, label) {
    return L.divIcon({
      className: '',
      html: `<div class="map-pin ${className}">${label}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  }

  function originIcon() {
    return pinIcon('map-pin-origin', 'A');
  }

  function destinationIcon() {
    return pinIcon('map-pin-destination', 'B');
  }

  function driverIcon() {
    return pinIcon('map-pin-driver', '🚕');
  }

  /** Draws the route polyline returned by /api/route. */
  function drawRoute(map, path, layerHolder) {
    if (layerHolder.route) map.removeLayer(layerHolder.route);

    const points = path.map((p) => [p.lat, p.lng]);
    layerHolder.route = L.polyline(points, {
      color: '#00b074',
      weight: 5,
      opacity: 0.85,
    }).addTo(map);
    return layerHolder.route;
  }

  /** Fits the map view around the given points. */
  function fitToPoints(map, points) {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [30, 30] });
  }

  return { createMap, originIcon, destinationIcon, driverIcon, drawRoute, fitToPoints, TEHRAN_CENTER };
})();
