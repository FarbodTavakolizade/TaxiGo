/**
 * Passenger "Request Taxi" page.
 *
 * Flow:
 *   1. Pick "Select Origin" or "Select Destination" mode.
 *   2. Click the map once per mode (or drag the marker afterwards).
 *   3. "Calculate Route" asks the server for the shortest path (Dijkstra),
 *      the distance, the estimated time and the price.
 *   4. "Request Taxi" submits the form including the selected coordinates.
 */

document.addEventListener('DOMContentLoaded', () => {
  const mapElement = document.getElementById('request-map');
  if (!mapElement) return;

  const map = TaxiMap.createMap('request-map');

  const selection = {
    origin: null,      // { lat, lng }
    destination: null, // { lat, lng }
    route: null,       // last route result from the server
  };

  const markers = { origin: null, destination: null };
  const layerHolder = { route: null };
  const driverLayer = L.layerGroup().addTo(map);

  const state = {
    mode: 'origin', // which point the next map click sets
  };

  // ---------- small DOM helpers ----------
  const el = (id) => document.getElementById(id);
  const originText = el('origin');
  const destinationText = el('destination');
  const estimateBox = el('estimate-box');
  const errorBox = el('map-error');
  const hint = el('map-hint');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
  }

  // ---------- driver markers (simulated locations) ----------
  async function loadDrivers() {
    try {
      const response = await fetch('/api/drivers');
      if (!response.ok) return;
      const data = await response.json();

      driverLayer.clearLayers();
      data.drivers.forEach((driver) => {
        L.marker([driver.lat, driver.lng], { icon: TaxiMap.driverIcon() })
          .bindPopup(
            `<strong>${driver.name}</strong><br>` +
            `${driver.area} - ${driver.busy ? 'busy' : 'available'}`
          )
          .addTo(driverLayer);
      });
    } catch (err) {
      // Driver markers are decoration; the page still works without them.
      console.warn('Could not load driver locations', err);
    }
  }

  // ---------- selection ----------
  function setPoint(kind, lat, lng) {
    selection[kind] = { lat, lng };
    selection.route = null; // the old route no longer matches

    const icon = kind === 'origin' ? TaxiMap.originIcon() : TaxiMap.destinationIcon();
    if (markers[kind]) {
      markers[kind].setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
      // Dragging a marker updates the point in the same way as a map click.
      marker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        setPoint(kind, position.lat, position.lng);
      });
      markers[kind] = marker;
    }

    const label = el(`${kind}-coords`);
    if (label) label.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    updateEstimateBox(null);
    updateSubmitState();
  }

  function resetSelection() {
    selection.origin = null;
    selection.destination = null;
    selection.route = null;

    Object.values(markers).forEach((marker) => {
      if (marker) map.removeLayer(marker);
    });
    markers.origin = null;
    markers.destination = null;

    if (layerHolder.route) {
      map.removeLayer(layerHolder.route);
      layerHolder.route = null;
    }

    if (el('origin-coords')) el('origin-coords').textContent = '';
    if (el('destination-coords')) el('destination-coords').textContent = '';

    map.setView([TaxiMap.TEHRAN_CENTER.lat, TaxiMap.TEHRAN_CENTER.lng], 11);
    updateEstimateBox(null);
    updateSubmitState();
  }

  // ---------- route + estimates ----------
  async function calculateRoute() {
    showError('');

    if (!selection.origin || !selection.destination) {
      showError('Please select both an origin and a destination on the map.');
      return;
    }

    const button = el('calculate-route');
    button.disabled = true;
    button.textContent = 'Calculating...';

    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originLat: selection.origin.lat,
          originLng: selection.origin.lng,
          destinationLat: selection.destination.lat,
          destinationLng: selection.destination.lng,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Unable to calculate route', 'warning');
        return;
      }

      selection.route = data;
      TaxiMap.drawRoute(map, data.path, layerHolder);
      TaxiMap.fitToPoints(map, data.path);
      updateEstimateBox(data);

      // The route is known now, so the form fields can be filled in and the
      // "Request Taxi" button becomes usable.
      updateSubmitState();

      if (data.usedFallback) {
        showToast('Points are outside the road graph - using straight-line distance', 'info');
      } else {
        showToast(`Route found: ${data.distanceKm} km`, 'success');
      }
    } catch (err) {
      showToast('Unable to calculate route. Please try again.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Calculate Route';
    }
  }

  function updateEstimateBox(route) {
    if (!route) {
      estimateBox.hidden = true;
      return;
    }
    el('estimate-distance').textContent = `${route.distanceKm} km`;
    el('estimate-duration').textContent = `${route.durationMin} min`;
    el('estimate-price').textContent = `${Number(route.price).toLocaleString()} تومان`;
    estimateBox.hidden = false;
  }

  // The Request Taxi button only works once the route has been calculated,
  // so every ride with coordinates has a distance and a price.
  function updateSubmitState() {
    const submit = el('request-taxi');
    const hasRoute = Boolean(selection.route) && Boolean(selection.origin) && Boolean(selection.destination);
    submit.disabled = !hasRoute;
    submit.title = hasRoute ? '' : 'Select both points and calculate the route first';

    if (hasRoute) {
      el('form-origin-lat').value = selection.origin.lat;
      el('form-origin-lng').value = selection.origin.lng;
      el('form-destination-lat').value = selection.destination.lat;
      el('form-destination-lng').value = selection.destination.lng;

      if (!originText.value) originText.value = `Point ${selection.origin.lat.toFixed(4)}, ${selection.origin.lng.toFixed(4)}`;
      if (!destinationText.value) destinationText.value = `Point ${selection.destination.lat.toFixed(4)}, ${selection.destination.lng.toFixed(4)}`;
    } else {
      el('form-origin-lat').value = '';
      el('form-origin-lng').value = '';
      el('form-destination-lat').value = '';
      el('form-destination-lng').value = '';
    }
  }

  // ---------- mode buttons ----------
  function setMode(mode) {
    state.mode = mode;
    el('mode-origin').classList.toggle('active', mode === 'origin');
    el('mode-destination').classList.toggle('active', mode === 'destination');
    hint.textContent = mode === 'origin'
      ? 'Click the map to set the origin.'
      : 'Click the map to set the destination.';
  }

  map.on('click', (event) => {
    // First click sets the origin, then the mode switches to destination
    // automatically. The buttons can always override the mode.
    setPoint(state.mode, event.latlng.lat, event.latlng.lng);

    if (state.mode === 'origin' && !selection.destination) {
      setMode('destination');
    }
  });

  el('mode-origin').addEventListener('click', () => setMode('origin'));
  el('mode-destination').addEventListener('click', () => setMode('destination'));
  el('reset-selection').addEventListener('click', resetSelection);
  el('calculate-route').addEventListener('click', calculateRoute);

  // Keep the hidden form fields in sync when the text fields are edited.
  if (originText && destinationText) {
    originText.addEventListener('input', updateSubmitState);
    destinationText.addEventListener('input', updateSubmitState);
  }

  // ---------- submit the request with a "finding a driver" animation ----------
  const form = el('ride-form');
  const overlay = el('finding-overlay');

  /** Shows the overlay in its "searching" state. */
  function showFindingState() {
    el('finding-taxi').textContent = '🚕';
    el('finding-title-text').textContent = 'Finding a driver';
    el('finding-sub').textContent = 'Looking for the nearest available driver';
    el('finding-dots').hidden = false;
    overlay.classList.remove('is-found');
    overlay.hidden = false;
  }

  /** Switches the overlay to the "driver found" state. */
  function showFoundState(message) {
    el('finding-taxi').textContent = '✓';
    el('finding-title-text').textContent = 'Driver Found';
    el('finding-sub').textContent = message;
    el('finding-dots').hidden = true;
    overlay.classList.add('is-found');
  }

  function hideOverlay() {
    overlay.hidden = true;
  }

  if (form && overlay) {
    form.addEventListener('submit', async (event) => {
      // Without JavaScript the form keeps working the normal way.
      event.preventDefault();
      if (!selection.route) return;

      const submitButton = el('request-taxi');
      submitButton.disabled = true;
      showFindingState();

      try {
        // Same request the form would send, so the backend is unchanged.
        const response = await fetch(form.action, {
          method: 'POST',
          body: new URLSearchParams(new FormData(form)),
        });

        // The server replies with a redirect to the new ride page.
        const rideUrl = response.url;
        let driverMessage = 'Your ride has been requested';

        // Ask the existing ride API who was assigned (read-only).
        try {
          const rideId = rideUrl.split('/').pop();
          const rideResponse = await fetch(`/api/rides/${rideId}`);
          if (rideResponse.ok) {
            const ride = await rideResponse.json();
            if (ride.driverName) {
              driverMessage = `${ride.driverName} is on the way`;
            } else {
              driverMessage = 'Waiting for a driver to accept';
            }
          }
        } catch (err) {
          // Keep the generic message; the animation still completes.
        }

        showFoundState(driverMessage);
        showToast('Ride requested successfully', 'success');

        // Give the user a moment to see "Driver Found", then open the ride.
        setTimeout(() => {
          window.location.href = rideUrl;
        }, 1100);
      } catch (err) {
        hideOverlay();
        submitButton.disabled = false;
        showToast('Unable to send the request. Please try again.', 'error');
      }
    });
  }

  setMode('origin');
  updateSubmitState();
  loadDrivers();
});
