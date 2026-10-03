/**
 * Read-only ride map, used on:
 *   - passenger ride details page
 *   - driver ride details page
 *   - driver dashboard (active ride + own location)
 *
 * The page provides the data through a JSON script tag (#ride-map-data):
 *   { mapId, status, originLat, originLng, destinationLat, destinationLng,
 *     driverLat, driverLng, driverName, rideId, poll }
 *
 * When poll = true the ride status is refreshed from /api/rides/:id
 * every few seconds (plain fetch polling - no WebSockets).
 *
 * The driver marker movement is a VISUAL SIMULATION only. It interpolates
 * the marker between two fixed points; there is no real GPS and the
 * database is not changed.
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

  // ----- simulated driver movement (visual only) -----
  let driverMoving = false;

  function moveMarker(marker, from, to, durationMs, onDone) {
    const start = performance.now();
    driverMoving = true;

    function step(now) {
      const progress = Math.min((now - start) / durationMs, 1);
      // Ease in-out so the movement looks natural.
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      marker.setLatLng([
        from.lat + (to.lat - from.lat) * eased,
        from.lng + (to.lng - from.lng) * eased,
      ]);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        driverMoving = false;
        if (onDone) onDone();
      }
    }

    requestAnimationFrame(step);
  }

  function simulateDriverMovement() {
    if (!driverMarker) return;

    const pickup = { lat: data.originLat, lng: data.originLng };
    const destination = { lat: data.destinationLat, lng: data.destinationLng };
    const hasPickup = pickup.lat != null && pickup.lng != null;
    const hasDestination = destination.lat != null && destination.lng != null;
    const isDriverView = data.viewerRole === 'DRIVER';

    if (data.status === 'ACCEPTED' && hasPickup) {
      // Driver drives from the current location to the pickup point.
      showToast(
        isDriverView ? 'Driving to the pickup point' : 'Driver arriving at your pickup point',
        'info'
      );
      moveMarker(driverMarker, { lat: driverMarker.getLatLng().lat, lng: driverMarker.getLatLng().lng },
        pickup, 2600, () => {
          driverMarker.bindPopup(data.driverName ? `${data.driverName} - arrived` : 'Arrived');
        });
    } else if (data.status === 'STARTED' && hasPickup && hasDestination) {
      // Ride in progress: drive from the pickup to the destination.
      showToast(isDriverView ? 'Ride in progress' : 'Your ride is in progress', 'info');
      moveMarker(driverMarker, pickup, destination, 3200);
    }
  }

  simulateDriverMovement();

  // ----- completion card (revealed when the ride finishes) -----
  const completionBox = document.getElementById('completion-message');
  if (completionBox && data.status === 'COMPLETED') {
    completionBox.hidden = false;
  }

  // ----- status polling (optional, simple fetch every 4 seconds) -----
  if (data.poll && data.rideId) {
    const statusElement = document.getElementById('ride-status-badge');
    const driverInfo = document.getElementById('ride-driver-info');
    const tracker = document.getElementById('ride-status-tracker');
    let lastStatus = data.status;

    setInterval(async () => {
      try {
        const response = await fetch(`/api/rides/${data.rideId}`);
        if (!response.ok) return;
        const ride = await response.json();

        if (statusElement) {
          statusElement.textContent = ride.status;
          statusElement.className = `badge badge-${ride.status}`;
        }

        if (ride.driverLocation && driverMarker && !driverMoving) {
          driverMarker.setLatLng([ride.driverLocation.lat, ride.driverLocation.lng]);
        }

        if (driverInfo && ride.driverName) {
          driverInfo.textContent = ride.driverName;
        }

        // Announce a status change with a toast and update the tracker.
        if (ride.status !== lastStatus) {
          announceStatus(ride.status);
          lastStatus = ride.status;

          if (tracker) {
            // The tracker is rendered by the server; reload the page so it
            // shows the new state without duplicating view logic here.
            setTimeout(() => window.location.reload(), 1600);
          }
        }
      } catch (err) {
        // Polling is best effort; a failed request is ignored.
      }
    }, 4000);
  }

  /** Toast message for a status change. */
  function announceStatus(status) {
    if (status === 'ACCEPTED') showToast('Driver found', 'success');
    else if (status === 'STARTED') showToast('Ride started', 'info');
    else if (status === 'COMPLETED') showToast('Ride completed', 'success');
    else if (status === 'CANCELLED') showToast('Ride cancelled', 'warning');

    if (status === 'COMPLETED' && completionBox) {
      completionBox.hidden = false;
    }
  }
});
