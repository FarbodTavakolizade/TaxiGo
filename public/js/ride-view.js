/**
 * Read-only ride map, used on:
 *   - passenger ride details page
 *   - driver ride details page
 *   - driver dashboard (active ride + own location)
 *
 * The page provides the data through a JSON script tag (#ride-map-data):
 *   { mapId, originLat, originLng, destinationLat, destinationLng,
 *     driverLat, driverLng, rideId, poll }
 *
 * When poll = true the ride status is refreshed from /api/rides/:id
 * every few seconds (plain fetch polling - no WebSockets).
 */

document.addEventListener('DOMContentLoaded', () => {
  const dataElement = document.getElementById('ride-map-data');
  if (!dataElement) return;

  const data = JSON.parse(dataElement.textContent);
  const map = TaxiMap.createMap(data.mapId, { lat: data.originLat || undefined, lng: data.originLng || undefined });
  const points = [];

  if (data.originLat != null && data.originLng != null) {
    L.marker([data.originLat, data.originLng], { icon: TaxiMap.originIcon() })
      .bindPopup('Origin')
      .addTo(map);
    points.push({ lat: data.originLat, lng: data.originLng });
  }

  if (data.destinationLat != null && data.destinationLng != null) {
    L.marker([data.destinationLat, data.destinationLng], { icon: TaxiMap.destinationIcon() })
      .bindPopup('Destination')
      .addTo(map);
    points.push({ lat: data.destinationLat, lng: data.destinationLng });
  }

  let driverMarker = null;
  if (data.driverLat != null && data.driverLng != null) {
    driverMarker = L.marker([data.driverLat, data.driverLng], { icon: TaxiMap.driverIcon() })
      .bindPopup(data.driverName ? `Driver: ${data.driverName}` : 'Driver')
      .addTo(map);
    points.push({ lat: data.driverLat, lng: data.driverLng });
  }

  TaxiMap.fitToPoints(map, points);

  // Route polyline, calculated by the server (Dijkstra).
  const layerHolder = { route: null };
  if (data.originLat != null && data.destinationLat != null) {
    fetch('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originLat: data.originLat,
        originLng: data.originLng,
        destinationLat: data.destinationLat,
        destinationLng: data.destinationLng,
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((route) => {
        if (route) TaxiMap.drawRoute(map, route.path, layerHolder);
      })
      .catch(() => {
        // The map still shows the markers; only the line is missing.
      });
  }

  // ----- status polling (optional, simple fetch every 4 seconds) -----
  if (data.poll && data.rideId) {
    const statusElement = document.getElementById('ride-status-badge');
    const driverInfo = document.getElementById('ride-driver-info');

    setInterval(async () => {
      try {
        const response = await fetch(`/api/rides/${data.rideId}`);
        if (!response.ok) return;
        const ride = await response.json();

        if (statusElement) {
          statusElement.textContent = ride.status;
          statusElement.className = `badge badge-${ride.status}`;
        }

        if (ride.driverLocation && driverMarker) {
          driverMarker.setLatLng([ride.driverLocation.lat, ride.driverLocation.lng]);
        }

        if (driverInfo && ride.driverName) {
          driverInfo.textContent = ride.driverName;
        }
      } catch (err) {
        // Polling is best effort; a failed request is ignored.
      }
    }, 4000);
  }
});
