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
- Text-based origin and destination (no map, no coordinates)
- A strictly defined ride status workflow:
  REQUESTED → ACCEPTED → STARTED → COMPLETED, with cancellation allowed
  from REQUESTED and ACCEPTED
- Passenger ride list, cancellation and status display
- Driver list of available requests, accept / start / complete / cancel
- Admin statistics, user list with deactivate/activate, and full ride list
- Server-side validation and friendly error messages

## 5. Out of scope (explicitly NOT implemented)

The following were intentionally excluded to keep the project small and
demonstrable:

- GPS, maps, live tracking, route calculation
- Real-time features (WebSockets), chat, notifications, SMS or email
- Online payments, pricing, coupons, wallets
- Driver matching algorithms, ratings, reviews
- Multiple vehicles per driver, ride sharing
- Reporting/analytics beyond the simple dashboard counters
- Machine learning, AI, external APIs
- Docker, Kubernetes, cloud deployment

## 6. Intended users

| User      | Goal                                                     |
|-----------|----------------------------------------------------------|
| Passenger | Get a taxi for a trip and follow the ride status         |
| Driver    | Find work by accepting and completing ride requests      |
| Admin     | Keep the system clean and observe its basic statistics   |

## 7. Technology choice

| Layer     | Choice                       | Reason                                   |
|-----------|------------------------------|------------------------------------------|
| Runtime   | Node.js + Express            | Required by the course; simple and common |
| Database  | PostgreSQL, driver `pg`      | Required by the course; SQL is taught     |
| Templates | EJS                          | Server-side rendering, no frontend framework |
| Styling   | Plain CSS3                   | No build step, easy to explain            |
| Scripting | Vanilla JavaScript           | Only for small conveniences (confirmations) |
| Auth      | express-session + bcrypt     | Simple and standard, no JWT complexity    |
| Tests     | Jest                         | Simple unit testing framework             |

## 8. Success criteria

1. `npm install` and `npm start` run the application on `http://localhost:3000`.
2. The complete ride workflow can be demonstrated from the web GUI with three
   accounts (passenger, driver, admin).
3. Invalid status transitions and unauthorized page access are rejected.
4. `npm test` runs green.
5. The documentation describes the actual implemented system.
