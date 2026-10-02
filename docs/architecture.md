# Architecture

## 1. Overview

The application uses a simple layered architecture. Each layer only calls the
layer below it; the web layer never talks to the database directly.

```mermaid
flowchart TD
    B[Browser<br/>HTML forms, Leaflet map, small JS] -->|HTTP + fetch JSON| R[Express Routes]
    R --> C[Controllers<br/>request/response handling]
    C --> S[Services<br/>business rules, validation, workflow,<br/>Dijkstra routing, pricing, driver selection]
    S --> Rep[Repositories<br/>parameterized SQL]
    Rep --> DB[(PostgreSQL)]
    S -.->|in-memory graph| G[data/tehranGraph.js]
```

Responsibilities:

| Layer        | Directory            | Responsibility                                              |
|--------------|----------------------|-------------------------------------------------------------|
| Routes       | `src/routes/`        | URL definitions, attach auth middleware per role            |
| Controllers  | `src/controllers/`   | Read request data, call services, render views or JSON      |
| Services     | `src/services/`      | Validation, permissions, ride status workflow, statistics, routing, pricing, driver assignment |
| Repositories | `src/repositories/`  | All SQL statements (parameterized)                          |
| Graph data   | `src/data/`          | The simplified Tehran road graph (nodes and edges)          |
| Middleware   | `src/middleware/`    | `requireAuth`, `requireRole`, error handling                |
| Views        | `views/`             | EJS templates (presentation only)                           |
| Browser JS   | `public/js/`         | Leaflet map behaviour, route drawing, status polling        |
| Database     | `src/db/`            | Connection pool, setup and migration scripts                |

## 2. Module structure

- `src/app.js` – builds the Express app (static files, body parsing, session,
  flash helper, routes, error handlers)
- `src/server.js` – starts the HTTP server
- `src/constants.js` – roles, statuses and the transition table
- `src/errors.js` – `AppError` for expected errors
- `src/config.js` – `.env` values plus pricing and routing constants
- `src/services/routingService.js` – Dijkstra on the Tehran graph, nearest
  node lookup, Haversine fallback
- `src/services/pricingService.js` – price and duration estimation
- `src/services/driverService.js` – driver locations and nearest driver
- `src/data/tehranGraph.js` – 13 nodes / 20 edges of the simplified network

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
        +showRideDetails(req, res)
        +cancelRide(req, res)
    }
    class DriverController {
        +dashboard(req, res)
        +showRides(req, res)
        +showRideDetails(req, res)
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
    class ApiController {
        +calculateRoute(req, res)
        +listDrivers(req, res)
        +listGraphNodes(req, res)
        +getRide(req, res)
    }
    class AuthService {
        +register(name, email, password, role)
        +login(email, password)
    }
    class RideService {
        +requestRide(user, input)
        +getRideDetails(user, id)
        +cancelByPassenger(user, id)
        +acceptRide(user, id)
        +startRide(user, id)
        +completeRide(user, id)
        +cancelByDriver(user, id)
    }
    class RoutingService {
        +calculateRoute(coords)
        +dijkstra(startId, endId)
        +findNearestNode(lat, lng)
    }
    class PricingService {
        +calculatePrice(distanceKm)
        +calculateDuration(distanceKm)
        +estimateRide(distanceKm)
    }
    class DriverService {
        +getDriversForMap()
        +findNearestAvailableDriver(lat, lng)
        +getDriverLocation(driverId)
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
    class DriverRepository {
        +findAllWithLocations()
        +findAvailableWithLocations()
        +findLocationByDriver(id)
    }
    class TehranGraph {
        +TEHRAN_NODES
        +TEHRAN_EDGES
    }
    class GeoUtils {
        +haversineDistanceKm(lat1, lng1, lat2, lng2)
        +isValidCoordinates(lat, lng)
        +roundTo(value, decimals)
    }

    AuthController --> AuthService
    PassengerController --> RideService
    DriverController --> RideService
    DriverController --> DriverService
    AdminController --> AdminService
    ApiController --> RoutingService
    ApiController --> PricingService
    ApiController --> DriverService
    ApiController --> RideService
    AuthService --> UserRepository
    RideService --> RideRepository
    RideService --> RoutingService
    RideService --> PricingService
    RideService --> DriverService
    RoutingService --> TehranGraph
    RoutingService --> GeoUtils
    DriverService --> DriverRepository
    DriverService --> GeoUtils
    PricingService --> Config
    AdminService --> UserRepository
    AdminService --> RideRepository
```

## 4. Sequence diagram – passenger creates a ride with the map

```mermaid
sequenceDiagram
    actor P as Passenger
    participant B as Browser (Leaflet)
    participant C as PassengerController
    participant S as RideService
    participant RT as RoutingService
    participant PR as PricingService
    participant D as DriverService
    participant R as RideRepository
    participant DB as PostgreSQL

    P->>B: Click origin and destination on the map
    P->>B: Click "Calculate Route"
    B->>RT: POST /api/route (via ApiController)
    RT->>RT: findNearestNode + dijkstra
    RT->>PR: estimateRide(distanceKm)
    PR-->>RT: price + duration
    RT-->>B: JSON { distanceKm, path, price, durationMin }
    B->>P: Draw polyline, show distance/time/price

    P->>B: Click "Request Taxi"
    B->>C: POST /passenger/rides (with coordinates)
    C->>S: requestRide(user, input)
    S->>RT: calculateRoute(coordinates)
    RT-->>S: distance, path
    S->>PR: estimateRide(distanceKm)
    PR-->>S: price, duration
    S->>D: findNearestAvailableDriver(originLat, originLng)
    D-->>S: nearest driver + distance
    S->>R: createRide({... driverId})
    R->>DB: INSERT INTO rides (... status='ACCEPTED')
    DB-->>R: new ride
    R-->>S: ride row
    S-->>C: { ride, assignment }
    C-->>B: 302 redirect to /passenger/rides/:id
    B->>P: Ride details with driver marker and route
```

## 5. Sequence diagram – driver accepts a ride (manual workflow)

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
    B->>D: Dashboard shows active ride on the map (ACCEPTED)
```

## 6. Request flow through the middlewares

```mermaid
flowchart LR
    Req[HTTP request] --> Static[express.static]
    Static --> Body[urlencoded + JSON body parser]
    Body --> Sess[express-session]
    Sess --> Locals[flash + template locals]
    Locals --> Routes[Role routers + API router]
    Routes --> AuthMW{requireAuth<br/>requireRole}
    AuthMW -->|allowed| Ctrl[Controller]
    AuthMW -->|denied| Err[Error handler]
    Ctrl --> Svc[Service] --> Repo[Repository] --> DB[(PostgreSQL)]
    Ctrl -->|HTML| View[EJS view] --> Res[HTTP response]
    Ctrl -->|JSON| Res
```

## 7. Map data flow

```mermaid
flowchart LR
    Map[Leaflet map in browser] -->|tiles| OSM[(OpenStreetMap<br/>tile server)]
    Map -->|POST /api/route| API[ApiController]
    Map -->|GET /api/drivers| API
    Map -->|GET /api/rides/:id polling| API
    API --> Routing[routingService<br/>Dijkstra]
    API --> Pricing[pricingService]
    API --> Drivers[driverService]
    Drivers --> DL[(driver_locations)]
```
