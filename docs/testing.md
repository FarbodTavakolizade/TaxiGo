# Testing

## 1. How to run the tests

```
npm test
```

(Equivalent: `npx jest`.) The tests do not need a running database: the
repository layer is replaced with Jest mocks, and middleware tests use fake
request/response objects.

Current result: **3 test suites, 34 tests, all passing.**

## 2. Test files

| File                             | What it covers                                              |
|----------------------------------|-------------------------------------------------------------|
| `tests/constants.test.js`        | The allowed ride status transition table                    |
| `tests/rideService.test.js`      | Ride business rules (create, accept, start, complete, cancel, invalid transitions) |
| `tests/authMiddleware.test.js`   | `requireAuth` and `requireRole` access control              |

## 3. Required test cases from the specification

| # | Required test case                              | Where it is tested                                                               | Status |
|---|-------------------------------------------------|----------------------------------------------------------------------------------|--------|
| 1 | Passenger can create ride                       | `rideService.test.js` → "creates a ride with trimmed origin and destination"     | ✔      |
| 2 | Driver can accept ride                          | `rideService.test.js` → "accepts a REQUESTED ride"                               | ✔      |
| 3 | Driver can start ride                           | `rideService.test.js` → "starts an ACCEPTED ride that belongs to the driver"     | ✔      |
| 4 | Driver can complete ride                        | `rideService.test.js` → "completes a STARTED ride that belongs to the driver"    | ✔      |
| 5 | Passenger can cancel requested ride             | `rideService.test.js` → "cancels a REQUESTED ride"                               | ✔      |
| 6 | Invalid status transition is rejected           | `rideService.test.js` → "rejects completing a ride that is only ACCEPTED", "driver cannot cancel a STARTED ride", `constants.test.js` transition table tests | ✔ |
| 7 | Unauthorized user cannot access protected routes| `authMiddleware.test.js` → `requireRole` tests (passenger → driver page, driver → admin page, guest) | ✔ |

## 4. Additional covered cases

- Empty origin / destination rejected when creating a ride
- Driver cannot create a ride request
- Passenger cannot accept a ride
- Accepting fails cleanly when another driver was faster (atomic UPDATE returns 0 rows)
- A driver cannot start or complete another driver's ride
- Passenger cannot cancel someone else's ride
- Cancelling a STARTED ride is rejected
- Deactivated user is logged out by `requireAuth`
- Ride counts and dashboard aggregation for the driver dashboard

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

## 6. Notes

- Tests mock `src/repositories/*`, so no database connection is opened during
  `npm test`.
- `src/db/pool.js` is still imported by the mocked modules; it creates a pool
  object but performs no query, so no connection is made.
- Manual GUI tests are documented here to keep the automated suite simple, as
  required by the project scope.
