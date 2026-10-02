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

## 6. External interfaces

- Web browser (HTML forms and links; one small JS file for confirm dialogs)
- PostgreSQL database on a configurable host and port

## 7. Assumptions and constraints

- The database is set up by the developer with `npm run db:setup`.
- Origin and destination are free text; there is no geocoding.
- Only one database instance and one web process are used.
