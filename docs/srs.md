# Software Requirements Specification (SRS)

## 1. Introduction

This document specifies the requirements of the Taxi Request and Transportation
Management System, a small university project implemented with Node.js,
Express, PostgreSQL and EJS.

## 2. Overall description

The system is a server-rendered web application. Visitors register or log in.
Every user has exactly one role: PASSENGER, DRIVER or ADMIN. The ride workflow
is a small state machine with five states and strictly limited transitions.

## 3. User roles

| Role      | Description                                              |
|-----------|----------------------------------------------------------|
| PASSENGER | Requests rides and follows their status                  |
| DRIVER    | Accepts, starts, completes or cancels assigned rides     |
| ADMIN     | Views statistics and manages user activation            |

## 4. Functional requirements

### 4.1 Authentication

| ID     | Requirement                                                                    |
|--------|--------------------------------------------------------------------------------|
| FR-1.1 | A visitor can register as PASSENGER or DRIVER with name, email and password.   |
| FR-1.2 | The email address must be unique; duplicates are rejected.                     |
| FR-1.3 | Passwords are stored only as bcrypt hashes.                                    |
| FR-1.4 | A registered user can log in with email and password.                          |
| FR-1.5 | A deactivated user cannot log in.                                              |
| FR-1.6 | The logged-in user's id, name, email and role are kept in the session.         |
| FR-1.7 | A user can log out, which destroys the session.                                |

### 4.2 Passenger

| ID     | Requirement                                                                       |
|--------|-----------------------------------------------------------------------------------|
| FR-2.1 | A passenger sees a dashboard with current ride count, completed ride count and recent rides. |
| FR-2.2 | A passenger can create a ride request with an origin and a destination (text, both required). |
| FR-2.3 | A passenger sees a list of all personal ride requests.                            |
| FR-2.4 | A passenger can cancel a ride while its status is REQUESTED or ACCEPTED.          |
| FR-2.5 | A passenger cannot cancel a ride that has been STARTED or finished.               |
| FR-2.6 | A passenger sees the current status of every ride (badge).                        |

### 4.3 Driver

| ID     | Requirement                                                                       |
|--------|-----------------------------------------------------------------------------------|
| FR-3.1 | A driver sees a dashboard with available requests, the current active ride and the completed ride count. |
| FR-3.2 | A driver sees the list of all REQUESTED rides.                                    |
| FR-3.3 | A driver can accept a REQUESTED ride; the ride is then assigned to that driver.   |
| FR-3.4 | A ride cannot be accepted twice; only the first driver succeeds.                  |
| FR-3.5 | A driver can start an ACCEPTED ride assigned to them.                             |
| FR-3.6 | A driver can complete a STARTED ride assigned to them.                            |
| FR-3.7 | A driver can cancel an ACCEPTED ride assigned to them.                            |
| FR-3.8 | A driver sees their personal ride history.                                        |
| FR-3.9 | A driver can only act on rides assigned to them.                                  |
| FR-3.10| A driver sees a map with their own simulated location, the pickup point, the destination and the route. |

### 4.3a Map, route and pricing (phase 2)

| ID     | Requirement                                                                       |
|--------|-----------------------------------------------------------------------------------|
| FR-8.1 | The passenger can select origin and destination by clicking an interactive Tehran map (Leaflet + OpenStreetMap). |
| FR-8.2 | Two selection modes exist (Select Origin / Select Destination); the first click sets the origin, the second the destination. |
| FR-8.3 | The selection can be reset at any time.                                           |
| FR-8.4 | The selected coordinates are stored with the ride request (origin_lat, origin_lng, destination_lat, destination_lng). |
| FR-8.5 | Existing text-based origin/destination fields remain usable without the map.       |
| FR-8.6 | The system calculates the shortest route between the nearest graph nodes using Dijkstra's algorithm on a simplified Tehran road graph. |
| FR-8.7 | The route is displayed as a polyline on the map together with the distance.        |
| FR-8.8 | The distance is calculated in kilometers; if the points are outside the simplified graph, a friendly message is shown and the straight-line Haversine distance is used as fallback. |
| FR-8.9 | Invalid coordinates are rejected with a clear message; the application never crashes. |
| FR-8.10| The estimated price is calculated as BASE_FARE + distanceKm × PRICE_PER_KM and rounded. |
| FR-8.11| The estimated duration is calculated as distance / AVERAGE_SPEED_KMH and shown in minutes. |
| FR-8.12| Pricing values and average speed are configurable in one place (src/config.js).    |
| FR-8.13| Simulated driver locations (fixed Tehran coordinates, not real GPS) are shown on the map with a distinct marker style. |
| FR-8.14| When a ride is requested with coordinates, the nearest available driver (Haversine distance) is assigned automatically and the ride starts as ACCEPTED. |
| FR-8.15| When no driver is available, the ride stays REQUESTED and remains manually acceptable. |
| FR-8.16| The ride details page shows origin, destination, driver, distance, estimated duration, estimated price, status and created time, plus a map. |
| FR-8.17| Active ride pages may refresh the status with simple HTTP polling (no WebSockets). |

### 4.4 Admin

| ID     | Requirement                                                                       |
|--------|-----------------------------------------------------------------------------------|
| FR-4.1 | An admin sees total users, drivers, passengers, total rides, completed rides and cancelled rides. |
| FR-4.2 | An admin sees the list of all users with role and active status.                  |
| FR-4.3 | An admin can deactivate and reactivate a user.                                    |
| FR-4.4 | An admin cannot deactivate their own account.                                     |
| FR-4.5 | An admin sees a list of all rides in the system.                                  |

### 4.5 Ride status workflow

Only the following states and transitions exist:

| ID     | Requirement                                                                 |
|--------|-----------------------------------------------------------------------------|
| FR-5.1 | States: REQUESTED, ACCEPTED, STARTED, COMPLETED, CANCELLED only.             |
| FR-5.2 | Allowed: REQUESTED → ACCEPTED, REQUESTED → CANCELLED.                        |
| FR-5.3 | Allowed: ACCEPTED → STARTED, ACCEPTED → CANCELLED.                          |
| FR-5.4 | Allowed: STARTED → COMPLETED.                                               |
| FR-5.5 | Any other transition is rejected with a friendly error message.              |
| FR-5.6 | Every transition stores its timestamp (accepted_at, started_at, completed_at, cancelled_at). |

### 4.6 Access control

| ID     | Requirement                                                                 |
|--------|-----------------------------------------------------------------------------|
| FR-6.1 | Guests can only access /login and /register.                                 |
| FR-6.2 | A passenger can only access /passenger/* pages.                              |
| FR-6.3 | A driver can only access /driver/* pages.                                    |
| FR-6.4 | An admin can only access /admin/* pages.                                     |
| FR-6.5 | Cross-role access is rejected (HTTP 403 or redirect to login when not logged in). |

### 4.7 Validation and error handling

| ID     | Requirement                                                                 |
|--------|-----------------------------------------------------------------------------|
| FR-7.1 | Required fields cannot be empty (name, email, password, origin, destination). |
| FR-7.2 | Email must have a valid format.                                              |
| FR-7.3 | Registration password must be at least 6 characters.                         |
| FR-7.4 | Origin and destination are limited to 200 characters.                        |
| FR-7.5 | Errors are shown as friendly messages in the GUI; no stack traces or SQL errors. |
| FR-7.6 | Unexpected server errors return HTTP 500 with a generic message.             |

## 5. Non-functional requirements

| ID      | Requirement                                                                  |
|---------|------------------------------------------------------------------------------|
| NFR-1   | The application runs locally with `npm install` and `npm start`.             |
| NFR-2   | The GUI is available at http://localhost:3000.                               |
| NFR-3   | PostgreSQL is the only data store; `pg` is the only database dependency.     |
| NFR-4   | Sessions are used for authentication; no JWT.                                |
| NFR-5   | All SQL is parameterized; no query string is built from user input.          |
| NFR-6   | Business logic lives in services; templates contain only presentation logic. |
| NFR-7   | Layered architecture: Routes → Controllers → Services → Repositories.        |
| NFR-8   | `npm test` runs Jest unit tests for the core business rules.                 |
| NFR-9   | The code base stays small and understandable (student project level).        |
| NFR-10  | UI works without frontend frameworks or build steps.                         |
| NFR-11  | The map uses Leaflet with OpenStreetMap tiles; no paid map API and no Google Maps. |
| NFR-12  | No real-time technology (no WebSockets, no Socket.IO, no queues); only plain HTTP requests and simple polling. |
| NFR-13  | No real GPS; driver positions are simulated fixed coordinates.               |
| NFR-14  | Routing runs locally on a small built-in graph (no external routing service). |
| NFR-15  | The OpenStreetMap attribution is shown on every map (license requirement).   |
| NFR-16  | Database changes for existing installations are applied with idempotent migrations that never destroy data. |

## 6. External interfaces

- Web browser (HTML forms and links; small JS files for map/confirmations)
- PostgreSQL database on a configurable host and port
- OpenStreetMap tile server for map backgrounds (free, no key)

## 7. Assumptions and constraints

- The database is set up by the developer with `npm run db:setup` (new) or
  `npm run db:migrate` (existing installation).
- Origin and destination are free text on the map; there is no geocoding
  service, so the text fields are not converted to coordinates automatically.
- The road graph is intentionally small and approximate; it demonstrates the
  algorithm and is not a navigation-grade model of Tehran.
- Driver locations are simulated and never change at runtime.
- Only one database instance and one web process are used.
