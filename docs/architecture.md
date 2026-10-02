# Architecture

## 1. Overview

The application uses a simple layered architecture. Each layer only calls the
layer below it; the web layer never talks to the database directly.

```mermaid
flowchart TD
    B[Browser<br/>HTML forms, links, small JS] -->|HTTP| R[Express Routes]
    R --> C[Controllers<br/>request/response handling]
    C --> S[Services<br/>business rules, validation, workflow]
    S --> Rep[Repositories<br/>parameterized SQL]
    Rep --> DB[(PostgreSQL)]
```

Responsibilities:

| Layer        | Directory            | Responsibility                                              |
|--------------|----------------------|-------------------------------------------------------------|
| Routes       | `src/routes/`        | URL definitions, attach auth middleware per role            |
| Controllers  | `src/controllers/`   | Read request data, call services, render views or redirect  |
| Services     | `src/services/`      | Validation, permissions, ride status workflow, statistics   |
| Repositories | `src/repositories/`  | All SQL statements (parameterized)                          |
| Middleware   | `src/middleware/`    | `requireAuth`, `requireRole`, error handling                |
| Views        | `views/`             | EJS templates (presentation only)                           |
| Database     | `src/db/`            | Connection pool and setup script                            |

## 2. Module structure

- `src/app.js` – builds the Express app (static files, body parsing, session,
  flash helper, routes, error handlers)
- `src/server.js` – starts the HTTP server
- `src/constants.js` – roles, statuses and the transition table
- `src/errors.js` – `AppError` for expected errors
- `src/config.js` – reads `.env`

## 3. Class diagram (modules and their main operations)

```mermaid
classDiagram
    class AuthController {
        +showLoginPage(req, res)
        +login(req, res)
        +showRegisterPage(req, res)
        +register(req, res)
        +logout(req, res)
    }
    class PassengerController {
        +dashboard(req, res)
        +showRides(req, res)
        +showNewRideForm(req, res)
        +createRide(req, res)
        +cancelRide(req, res)
    }
    class DriverController {
        +dashboard(req, res)
        +showRides(req, res)
        +acceptRide(req, res)
        +startRide(req, res)
        +completeRide(req, res)
        +cancelRide(req, res)
    }
    class AdminController {
        +dashboard(req, res)
        +showUsers(req, res)
        +setUserActive(req, res)
        +showRides(req, res)
    }
    class AuthService {
        +register(name, email, password, role)
        +login(email, password)
    }
    class RideService {
        +requestRide(user, data)
        +cancelByPassenger(user, id)
        +acceptRide(user, id)
        +startRide(user, id)
        +completeRide(user, id)
        +cancelByDriver(user, id)
        +getPassengerDashboard(id)
        +getDriverDashboard(id)
    }
    class AdminService {
        +getDashboardStats()
        +getUsers()
        +getAllRides()
        +setUserActive(admin, userId, isActive)
    }
    class UserRepository {
        +findByEmail(email)
        +findById(id)
        +createUser(data)
        +findAll()
        +setActive(id, isActive)
        +getStats()
    }
    class RideRepository {
        +createRide(data)
        +findById(id)
        +findByPassenger(id)
        +findRequested()
        +findByDriver(id)
        +assignToDriverIfRequested(rideId, driverId)
        +updateStatus(rideId, from, to)
        +getStats()
    }
    class Constants {
        +ROLES
        +RIDE_STATUS
        +canTransition(from, to)
    }
    class AuthMiddleware {
        +requireAuth(req, res, next)
        +requireRole(...roles)
        +requireGuest(req, res, next)
    }

    AuthController --> AuthService
    PassengerController --> RideService
    DriverController --> RideService
    AdminController --> AdminService
    AuthService --> UserRepository
    RideService --> RideRepository
    RideService --> Constants
    AdminService --> UserRepository
    AdminService --> RideRepository
```

## 4. Sequence diagram – passenger creates a ride

```mermaid
sequenceDiagram
    actor P as Passenger
    participant B as Browser
    participant C as PassengerController
    participant S as RideService
    participant R as RideRepository
    participant DB as PostgreSQL

    P->>B: Fill origin + destination, submit
    B->>C: POST /passenger/rides
    C->>S: requestRide(user, {origin, destination})
    S->>S: validate fields, check role
    S->>R: createRide({passengerId, origin, destination})
    R->>DB: INSERT INTO rides ... RETURNING id
    DB-->>R: new ride id
    R->>DB: SELECT ride with passenger/driver names
    DB-->>R: ride row
    R-->>S: ride
    S-->>C: ride
    C-->>B: 302 redirect to /passenger/rides
    B->>P: Ride list with REQUESTED badge
```

## 5. Sequence diagram – driver accepts a ride

```mermaid
sequenceDiagram
    actor D as Driver
    participant B as Browser
    participant C as DriverController
    participant S as RideService
    participant R as RideRepository
    participant DB as PostgreSQL

    D->>B: Click "Accept" on a request
    B->>C: POST /driver/rides/:id/accept
    C->>S: acceptRide(user, rideId)
    S->>R: findById(rideId)
    R->>DB: SELECT ride
    DB-->>R: ride row
    R-->>S: ride (status REQUESTED?)
    S->>R: assignToDriverIfRequested(rideId, driverId)
    R->>DB: UPDATE rides SET driver_id, status='ACCEPTED'<br/>WHERE id=$1 AND status='REQUESTED'
    DB-->>R: 1 row (or 0 if already taken)
    R-->>S: updated ride or null
    alt ride already taken
        S-->>C: AppError "just accepted by another driver"
        C-->>B: redirect back with error flash
    else success
        S-->>C: accepted ride
        C-->>B: 302 redirect to /driver/dashboard
    end
    B->>D: Dashboard shows active ride (ACCEPTED)
```

## 6. Request flow through the middlewares

```mermaid
flowchart LR
    Req[HTTP request] --> Static[express.static]
    Static --> Body[urlencoded body parser]
    Body --> Sess[express-session]
    Sess --> Locals[flash + template locals]
    Locals --> Routes[Role routers]
    Routes --> AuthMW{requireAuth<br/>requireRole}
    AuthMW -->|allowed| Ctrl[Controller]
    AuthMW -->|denied| Err[Error handler]
    Ctrl --> Svc[Service] --> Repo[Repository] --> DB[(PostgreSQL)]
    Ctrl -->|render| View[EJS view] --> Res[HTTP response]
```
