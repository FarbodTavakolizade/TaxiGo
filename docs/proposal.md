# Project Proposal

## 1. Project title

Taxi Request and Transportation Management System
(سامانه درخواست تاکسی و حمل‌ونقل)

## 2. Problem statement

There is no simple, transparent way for a passenger to request a taxi and for a
driver to pick up that request in a small local setting. Commercial platforms
are large, closed systems. This project demonstrates, at university scale, how
a basic ride request workflow can be implemented as a web application.

## 3. Goal

Build a small web application where:

- a **passenger** can request a ride by entering an origin and a destination,
- a **driver** can accept the request, start the ride and complete it,
- an **administrator** can observe the system and deactivate users,

with a clean but simple web GUI, a PostgreSQL database, and unit tests for the
core business rules.

## 4. Scope (what the system does)

- User registration and login with three roles: PASSENGER, DRIVER, ADMIN
- Session-based authentication and role-based page access
- Text-based origin and destination, **or selection on an interactive
  Tehran map (Leaflet + OpenStreetMap)**
- A strictly defined ride status workflow:
  REQUESTED → ACCEPTED → STARTED → COMPLETED, with cancellation allowed
  from REQUESTED and ACCEPTED
- Passenger ride list, cancellation and status display
- Driver list of available requests, accept / start / complete / cancel
- **Shortest route calculation with Dijkstra's algorithm on a simplified
  Tehran road graph (13 nodes, 20 edges)**
- **Distance in kilometers (graph route, with Haversine fallback), estimated
  travel time (30 km/h) and estimated price (base fare + price per km)**
- **Route drawn as a polyline on the map, with origin/destination markers**
- **Simulated driver locations shown on the map (no real GPS)**
- **Automatic assignment of the nearest available driver when a ride is
  requested from the map**
- Ride details page with map, driver, distance, duration and price
- Admin statistics, user list with deactivate/activate, and full ride list
- Server-side validation and friendly error messages

## 5. Out of scope (explicitly NOT implemented)

The following were intentionally excluded to keep the project small and
demonstrable:

- Real GPS tracking, live driver movement, route recalculation during a ride
- Real-time features (WebSockets, Socket.IO), chat, notifications, SMS, email
- Online payments, pricing complexity (surge, traffic, coupons, wallets)
- Driver matching beyond "nearest available by straight-line distance"
- Ratings, reviews, ride sharing, multiple vehicles per driver
- Reporting/analytics beyond the simple dashboard counters
- Machine learning, AI, external paid APIs (Google Maps, routing services)
- Docker, Kubernetes, cloud deployment

## 6. Intended users

| User      | Goal                                                     |
|-----------|----------------------------------------------------------|
| Passenger | Pick two points on the map, see the route and price, order a taxi, follow the ride status |
| Driver    | See the assigned ride on a map and complete it; accept open requests manually |
| Admin     | Keep the system clean and observe its basic statistics   |

## 7. Technology choice

| Layer     | Choice                       | Reason                                   |
|-----------|------------------------------|------------------------------------------|
| Runtime   | Node.js + Express            | Required by the course; simple and common |
| Database  | PostgreSQL, driver `pg`      | Required by the course; SQL is taught     |
| Templates | EJS                          | Server-side rendering, no frontend framework |
| Styling   | Plain CSS3                   | No build step, easy to explain            |
| Scripting | Vanilla JavaScript           | Map behaviour and small conveniences      |
| Map       | Leaflet + OpenStreetMap      | Free, open source, no API key, easy to explain |
| Routing   | Own Dijkstra implementation  | Demonstrates an actual algorithm          |
| Auth      | express-session + bcrypt     | Simple and standard, no JWT complexity    |
| Tests     | Jest                         | Simple unit testing framework             |

## 8. Success criteria

1. `npm install` and `npm start` run the application on `http://localhost:3000`.
2. The complete ride workflow can be demonstrated from the web GUI with three
   accounts (passenger, driver, admin).
3. A passenger can select origin and destination on the Tehran map, see the
   shortest route (Dijkstra) with distance, estimated time and price, request
   the ride and get the nearest driver assigned automatically.
4. Invalid status transitions, unauthorized page access, invalid coordinates
   and routes outside the graph are all handled without crashing.
5. `npm test` runs green.
6. The documentation describes the actual implemented system.
