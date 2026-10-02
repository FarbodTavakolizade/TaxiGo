# Testing

## 1. How to run the tests

```
npm test
```

(Equivalent: `npx jest`.) The tests do not need a running database: the
repository layer is replaced with Jest mocks, and middleware tests use fake
request/response objects.

Current result: **7 test suites, 82 tests, all passing.**

## 2. Test files

| File                             | What it covers                                              |
|----------------------------------|-------------------------------------------------------------|
| `tests/constants.test.js`        | The allowed ride status transition table                    |
| `tests/rideService.test.js`      | Ride business rules (create, accept, start, complete, cancel, invalid transitions, map coordinates, driver assignment, ride details access) |
| `tests/authMiddleware.test.js`   | `requireAuth` and `requireRole` access control              |
| `tests/geo.test.js`              | Haversine distance and coordinate validation                |
| `tests/routingService.test.js`   | Dijkstra shortest path, nearest node lookup, graph integrity, route calculation and fallback |
| `tests/pricingService.test.js`   | Price and duration formulas, rounding, single config source |
| `tests/driverService.test.js`    | Nearest driver selection and map data preparation           |

## 3. Required test cases from the specification

| # | Required test case                              | Where it is tested                                                               | Status |
|---|-------------------------------------------------|----------------------------------------------------------------------------------|--------|
| 1 | Passenger can create ride                       | `rideService.test.js` → "creates a plain text ride..." and "calculates route and price, and assigns the nearest driver" | ✔ |
| 2 | Driver can accept ride                          | `rideService.test.js` → "accepts a REQUESTED ride"                               | ✔      |
| 3 | Driver can start ride                           | `rideService.test.js` → "starts an ACCEPTED ride that belongs to the driver"     | ✔      |
| 4 | Driver can complete ride                        | `rideService.test.js` → "completes a STARTED ride that belongs to the driver"    | ✔      |
| 5 | Passenger can cancel requested ride             | `rideService.test.js` → "cancels a REQUESTED ride"                               | ✔      |
| 6 | Invalid status transition is rejected           | `rideService.test.js` → "rejects completing a ride that is only ACCEPTED", "driver cannot cancel a STARTED ride", `constants.test.js` transition table tests | ✔ |
| 7 | Unauthorized user cannot access protected routes| `authMiddleware.test.js` → `requireRole` tests (passenger → driver page, driver → admin page, guest) | ✔ |

## 3a. Required test cases for the map/routing features

| # | Required test case                              | Where it is tested                                                               | Status |
|---|-------------------------------------------------|----------------------------------------------------------------------------------|--------|
| 8 | Haversine distance calculation                  | `geo.test.js` → identical points, known Azadi–Tajrish distance, symmetry, Tehran–Shiraz | ✔ |
| 9 | Dijkstra shortest path                          | `routingService.test.js` → direct edge, shortest of several options (Vanak→Azadi), same node, unknown nodes | ✔ |
| 10| Price calculation                               | `pricingService.test.js` → formula, base fare only, rounding, invalid input     | ✔      |
| 11| Estimated duration calculation                  | `pricingService.test.js` → formula, rounding, minimum 1 minute                  | ✔      |
| 12| Nearest driver selection                        | `driverService.test.js` → picks Azadi driver for an Azadi origin, another driver for a Tajrish origin, none available | ✔ |
| 13| Ride creation with coordinates                  | `rideService.test.js` → coordinates converted to numbers, estimates stored, nearest driver assigned as ACCEPTED | ✔ |
| 14| Invalid coordinates handling                    | `rideService.test.js` → "rejects invalid coordinates sent from the browser"; `routingService.test.js` → invalid/out-of-range coordinates raise a clear error | ✔ |
| 15| Invalid route handling                          | `routingService.test.js` → far-away points use the straight-line fallback; unknown or unconnected nodes return no path; the endpoint never crashes | ✔ |

## 4. Additional covered cases (phase 1)

- Empty origin / destination rejected when creating a ride
- Driver cannot create a ride request
- Passenger cannot accept a ride
- Accepting fails cleanly when another driver was faster (atomic UPDATE returns 0 rows)
- A driver cannot start or complete another driver's ride
- Passenger cannot cancel someone else's ride
- Cancelling a STARTED ride is rejected
- Deactivated user is logged out by `requireAuth`
- Ride counts and dashboard aggregation for the driver dashboard

## 4a. Additional covered cases (phase 2)

- Ride details access: owner passenger allowed, other passenger denied,
  unassigned driver denied, missing ride reports not found
- A mapped ride stays REQUESTED when no driver is available
- Incomplete map selections (only some coordinates) are rejected
- Plain text rides without coordinates still work
- Driver map data marks drivers with an active ride as busy
- Numeric text from the database is converted to numbers for the map
- Graph integrity: every edge points to an existing node, no node is
  unreachable, all edge weights are positive
- Pricing values live in one configuration object and are positive

## 5. Manual test cases (GUI)

These were executed in the browser/HTTP during development:

| # | Scenario                              | Steps                                                        | Expected result                                        | Result |
|---|---------------------------------------|--------------------------------------------------------------|--------------------------------------------------------|--------|
| M1| Passenger registration                | /register → fill form → submit                               | Redirect to /login, success message                    | Pass   |
| M2| Duplicate email registration          | Register with existing email                                 | Form redisplayed with error message                    | Pass   |
| M3| Login (all three roles)               | /login with demo accounts                                    | Redirect to the matching dashboard                     | Pass   |
| M4| Wrong password                        | /login with wrong password                                   | Login page with "Email or password is incorrect."      | Pass   |
| M5| Deactivated user login                | Admin deactivates user, user tries to log in                 | Login refused with message                             | Pass   |
| M6| Cross-role access                     | Passenger opens /admin/dashboard, driver opens /passenger/dashboard | HTTP 403 "no permission" page                   | Pass   |
| M7| Guest access to protected page        | Open /passenger/dashboard without session                    | Redirect to /login                                     | Pass   |
| M8| Create ride                           | Passenger: Request Taxi → origin + destination → submit      | Ride appears with REQUESTED badge                      | Pass   |
| M9| Empty origin                          | Submit the ride form with empty origin                       | Form redisplayed with "Origin is required."            | Pass   |
| M10| Accept / start / complete            | Driver accepts, starts, completes the ride                   | Status badges ACCEPTED → STARTED → COMPLETED; timestamps set | Pass |
| M11| Double accept                        | Two drivers try to accept the same request                   | Second driver gets "just accepted by another driver"   | Pass   |
| M12| Passenger cancels REQUESTED ride     | Passenger clicks Cancel                                      | Status CANCELLED, cancelled_at set                     | Pass   |
| M13| Passenger cancels STARTED ride       | Passenger tries to cancel an active ride                     | Error message, status unchanged                        | Pass   |
| M14| Admin statistics                     | Open /admin/dashboard                                        | Counts match the database                              | Pass   |
| M15| Admin deactivate self                | Admin clicks Deactivate on own row                           | Blocked with message                                   | Pass   |
| M16| Unknown URL                          | Open /does-not-exist                                         | Friendly 404 page                                      | Pass   |
| M17| Map selection                        | Passenger clicks two points on the Tehran map                | Origin (A) and destination (B) markers appear; mode switches automatically | Pass |
| M18| Route calculation                    | Click "Calculate Route"                                      | Polyline drawn, distance/time/price shown              | Pass   |
| M19| Route reset                          | Click "Reset"                                                | Markers and route cleared, button disabled again       | Pass   |
| M20| Automatic driver assignment          | Request a ride with map coordinates                          | Nearest driver assigned, status ACCEPTED, driver marker shown | Pass |
| M21| Driver map                           | Driver opens dashboard with an active ride                   | Own location, pickup, destination and route visible    | Pass   |
| M22| Ride details map                     | Open /passenger/rides/:id                                    | Map shows origin, destination, driver and route        | Pass   |
| M23| Status polling                       | Keep an active ride details page open, complete it as driver | Badge updates to COMPLETED within a few seconds        | Pass   |
| M24| Invalid coordinates via API          | POST /api/route with `originLat: "abc"`                      | HTTP 400 with JSON error message, no crash             | Pass   |
| M25| Straight-line fallback               | Select two points far outside Tehran                         | Friendly message + straight-line distance used        | Pass   |

## 6. Notes

- Tests mock `src/repositories/*`, so no database connection is opened during
  `npm test`.
- `src/db/pool.js` is still imported by the mocked modules; it creates a pool
  object but performs no query, so no connection is made.
- Manual GUI tests are documented here to keep the automated suite simple, as
  required by the project scope.
- The map itself (Leaflet rendering, tile loading, marker dragging) is
  verified manually in the browser; the routing/pricing logic behind it is
  covered by unit tests.
