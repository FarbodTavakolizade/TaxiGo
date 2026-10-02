# Bug Report

Bugs found during development, with root cause and fix. Each entry lists the
phase in which it was found.

---

## BUG-1: Driver dashboard returned 403 Forbidden

- **Found in:** Phase 5 (driver functionality)
- **Severity:** High (driver pages completely unusable)
- **Symptom:** After logging in as a driver, `GET /driver/dashboard` returned
  HTTP 403 "You do not have permission to view this page", even though the
  user was an active driver. The passenger dashboard worked.
- **Steps to reproduce:**
  1. Log in as `driver@taxi.local`.
  2. Open `/driver/dashboard`.
  3. Observe HTTP 403.
- **Root cause:** Both role routers were mounted with `app.use()`, and each
  router protected itself with `router.use(requireAuth, requireRole(...))`
  **without a path**. In Express, `router.use()` middleware runs for *every*
  request that enters the router, not only for routes the router defines.
  Because `passengerRoutes` was mounted before `driverRoutes`, the driver
  request first entered the passenger router, hit
  `requireRole(PASSENGER)` and was rejected with 403 before it could reach
  the driver router.
- **Fix:** Scope the router middleware to its own path prefix:

  ```js
  // src/routes/passengerRoutes.js
  router.use('/passenger', requireAuth, requireRole(ROLES.PASSENGER));

  // src/routes/driverRoutes.js
  router.use('/driver', requireAuth, requireRole(ROLES.DRIVER));
  ```

  Path-scoped middleware now only runs for requests whose URL starts with the
  role prefix; requests for other routers pass through untouched.
- **Verification:** After the fix, `/driver/dashboard` returns 200 for a
  driver, and a driver still receives 403 on all `/passenger/*` pages.

---

## BUG-2: Login rejected short passwords before checking credentials

- **Found in:** Phase 8 (validation and error handling)
- **Severity:** Medium (confusing error message, wrong HTTP status)
- **Symptom:** Submitting the login form with a wrong password shorter than
  6 characters returned "Password must be at least 6 characters." (HTTP 400)
  instead of the intended "Email or password is incorrect." A real user with
  a valid 5-character password could never log in.
- **Steps to reproduce:**
  1. Open `/login`.
  2. Enter a valid email and a wrong password such as `wrongpw` (7 chars) —
     works as expected; but with `wrong` (5 chars) the minimum-length rule
     is triggered.
- **Root cause:** `authService.login()` reused `validatePassword()`, which
  implements the *registration* policy (minimum length). That policy must not
  be applied on login, where only presence of a password matters and the
  credential comparison produces the (deliberately vague) error message.
- **Fix:** Login now only validates that the password field is not empty and
  that the email has a valid shape:

  ```js
  const error = firstError(
    validateEmail(email),
    validateRequired(password, 'Password')
  );
  ```

  The controller renders the error inline above the form (HTTP 401 for wrong
  credentials, HTTP 403 for deactivated accounts).
- **Verification:** Wrong password (`wrong`, `wrongpw`, …) → HTTP 401 with
  "Email or password is incorrect."; deactivated account → HTTP 403 with the
  deactivation message; correct credentials → redirect to dashboard.

---

## BUG-3: Awkward error message for invalid transitions

- **Found in:** Phase 9 (while writing unit tests)
- **Severity:** Low (cosmetic)
- **Symptom:** Rejecting an invalid transition produced the grammatically
  wrong message "Only a accepted ride can be marked as cancelled."
- **Root cause:** The message was assembled from the lowercased status name:
  `Only a ${status.toLowerCase()} ride ...`.
- **Fix:** The message now uses the status constant and a neutral sentence:
  `Only a ride with status ACCEPTED can be marked as CANCELLED.`
- **Verification:** Unit tests assert the exact message
  (`tests/rideService.test.js`).

---

## Setup issue (environment, not application code)

**PostgreSQL could not start on port 5433.**
`pg_ctl` failed with `could not bind IPv4 address "127.0.0.1": Permission
denied` even though the port was free. Cause: Windows/Hyper-V reserved the
TCP port range 5433–5532 (`netsh interface ipv4 show excludedportrange
protocol=tcp`). The project-local database instance was moved to port 5544,
which works. Standard PostgreSQL installations on port 5432 are unaffected.

---

## Transient issues (no fix required)

- `npm install` failed once with `ECONNRESET` while downloading packages.
  Cleaning `node_modules`/`package-lock.json` and rerunning succeeded
  (network hiccup, not a code issue).
- `bcrypt` is a native module; its install script was flagged by npm's
  allow-scripts policy but the module loaded correctly afterwards (verified
  with a hash/compare smoke test).

---

# Phase 2 bugs (map, routing, pricing)

## BUG-4: Map API could not read JSON request bodies

- **Found in:** Phase 2 (map feature, first end-to-end API test)
- **Severity:** High (the route calculation endpoint failed completely)
- **Symptom:** `POST /api/route` returned `{"error":"Something went wrong."}`
  (HTTP 500). The server log showed
  `TypeError: Cannot destructure property 'originLat' of 'req.body' as it is undefined.`
- **Steps to reproduce:**
  1. Log in as a passenger.
  2. POST JSON `{originLat, originLng, destinationLat, destinationLng}` to
     `/api/route`.
  3. Observe HTTP 500.
- **Root cause:** The application was only configured with
  `express.urlencoded()`, because phase 1 used HTML forms exclusively. The
  new map code sends JSON with `fetch()`, and no JSON body parser was
  registered, so `req.body` stayed undefined for those requests.
- **Fix:** Added `app.use(express.json())` next to the urlencoded parser in
  `src/app.js`.
- **Verification:** `POST /api/route` now returns the route JSON, and the
  browser map draws the polyline. Invalid input returns HTTP 400 with a
  readable `{"error": ...}` message.

---

## BUG-5: Dijkstra accepted node ids that do not exist

- **Found in:** Phase 2 (by the new unit test "returns null for unknown nodes")
- **Severity:** Low (not reachable from the GUI, but a real correctness gap)
- **Symptom:** `dijkstra('vanak', 'does-not-exist')` returned
  `{ distanceKm: undefined, nodeIds: ['does-not-exist'] }` instead of
  reporting that no route exists.
- **Root cause:** The algorithm seeded the distance map from the node list but
  never verified that the requested start and end ids are actually part of the
  graph. An unknown end id never appeared in the distance map, so the
  "unreachable" check (`Infinity`) never triggered.
- **Fix:** `dijkstra()` now returns `null` immediately when either id is not a
  known node:

  ```js
  if (!getNode(startId) || !getNode(endId)) return null;
  ```
- **Verification:** The unit test passes, and the same guard protects the
  route calculation from unexpected ids.

---

## BUG-6: Wrong test expectation for the Azadi–Tajrish distance

- **Found in:** Phase 2 (new geo tests)
- **Severity:** Low (test bug, not an application bug)
- **Symptom:** The new test expected the straight-line distance between Azadi
  Square and Tajrish Square to be more than 15 km; the code returned 14.48 km
  and the test failed.
- **Root cause:** The expectation was guessed instead of computed. The
  Haversine result (14.48 km) is correct for the stored coordinates; the
  approximate driving distance is longer (~16–17 km) because roads are not
  straight.
- **Fix:** Corrected the test to the true range (14–15 km) and renamed it, so
  the difference between straight-line and road distance stays visible in the
  test suite.
- **Verification:** Full suite green (82 tests).

---

## Phase 2 setup notes

- The four demo drivers and the `driver_locations` table are added by the
  idempotent migration `database/migrations/001_add_ride_locations.sql`; the
  migration was run twice on the existing database to confirm that it neither
  duplicates rows nor destroys the rides created during phase 1.
- Leaflet is copied into `public/vendor/leaflet/` so the map library works
  without a CDN. Only the OpenStreetMap tile images need internet access.

---

## BUG-7: Driver markers never appeared on the request map

- **Found in:** Phase 2 (browser verification of the request page)
- **Severity:** High (the map's driver display did not work at all)
- **Symptom:** The Tehran map loaded and tiles rendered, but no taxi markers
  appeared, even though `GET /api/drivers` returned all four drivers when
  called manually from the page console. No JavaScript error was shown to the
  user; the page simply looked like it had no drivers.
- **Steps to reproduce:**
  1. Log in as a passenger and open `/passenger/rides/new`.
  2. Wait for the map to load.
  3. Observe that only the tile background appears (no driver markers).
- **Root cause:** `public/js/request-map.js` looked up the text inputs with
  the ids `origin-text` and `destination-text`, but the template in
  `views/passenger/new-ride.ejs` defines those inputs as `id="origin"` and
  `id="destination"`. The lookups returned `null`, and the first use
  (`originText.addEventListener` further down, reached through the initial
  `updateSubmitState()` call) threw a `TypeError`. That exception aborted the
  rest of the `DOMContentLoaded` handler, so `loadDrivers()` at the end of the
  handler never ran. Because the error happened inside a DOM event listener,
  it did not surface as a visible message.
- **Fix:** Corrected the element ids and made the input listeners defensive:

  ```js
  const originText = el('origin');
  const destinationText = el('destination');
  ...
  if (originText && destinationText) {
    originText.addEventListener('input', updateSubmitState);
    destinationText.addEventListener('input', updateSubmitState);
  }
  ```
- **Verification:** After the fix, four `🚕` driver markers render on the
  request map, and clicking the map still sets both markers correctly.

---

## BUG-8: "Request Taxi" stayed disabled after calculating the route

- **Found in:** Phase 2 (browser verification of the request flow)
- **Severity:** High (the main map ordering flow could not be completed)
- **Symptom:** After selecting both points and clicking "Calculate Route",
  the distance, time and price were shown and the route polyline was drawn,
  but the "Request Taxi" button remained greyed out, so the ride could not be
  submitted.
- **Steps to reproduce:**
  1. Open `/passenger/rides/new`.
  2. Click two points on the map.
  3. Click "Calculate Route" (the estimates appear).
  4. Observe that "Request Taxi" is still disabled.
- **Root cause:** The button state and the hidden coordinate fields are
  controlled by `updateSubmitState()`. The map click handlers and the reset
  button called it, but `calculateRoute()` did not call it after a successful
  response, so the state was never refreshed once the route existed.
- **Fix:** Call `updateSubmitState()` right after a successful route
  calculation:

  ```js
  selection.route = data;
  TaxiMap.drawRoute(map, data.path, layerHolder);
  TaxiMap.fitToPoints(map, data.path);
  updateEstimateBox(data);
  updateSubmitState();   // enables "Request Taxi" and fills the hidden fields
  ```
- **Verification:** After the fix, the button enables, the text fields are
  filled from the selected points, and submitting the form creates the ride
  with coordinates, distance, duration and price.

---

## Note on the browser-verification method

Both BUG-7 and BUG-8 were invisible to the automated test suite (they are
browser-side wiring problems) and were found only by driving the real page in
a browser and checking the rendered DOM after each action. They are recorded
here because the lesson is practical: unit tests over services are not enough
for map/UI features; the actual page must be exercised before delivery.
