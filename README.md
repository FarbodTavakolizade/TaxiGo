# 🚕 TaxiGo

**Taxi Request and Transportation Management System** — سامانه درخواست تاکسی و حمل‌ونقل

A small web-based taxi request system built as a university project. Passengers
pick their pickup point and destination on an interactive Tehran map, see the
shortest route with the estimated price before ordering, and get matched with a
nearby driver. Drivers complete the rides, and an administrator can view system
statistics and manage users.

The application is intentionally simple: server-rendered pages, a small layered
architecture, and a minimal dependency list. It is a student-level project —
not a commercial platform.

---

## Table of contents

- [Main features](#main-features)
- [Available user roles](#available-user-roles)
- [Landing page](#landing-page)
- [Passenger panel](#passenger-panel)
- [Driver panel](#driver-panel)
- [Admin panel](#admin-panel)
- [Authentication](#authentication)
- [Taxi request workflow](#taxi-request-workflow)
- [Ride statuses](#ride-statuses)
- [Tehran map (Leaflet / OpenStreetMap)](#tehran-map-leaflet--openstreetmap)
- [Routing — Dijkstra shortest path](#routing--dijkstra-shortest-path)
- [Distance, duration and price calculation](#distance-duration-and-price-calculation)
- [Driver assignment](#driver-assignment)
- [Light / Dark mode](#light--dark-mode)
- [Animations and UI](#animations-and-ui)
- [Technology stack](#technology-stack)
- [Project structure overview](#project-structure-overview)
- [Installation requirements](#installation-requirements)
- [PostgreSQL setup](#postgresql-setup)
- [Environment variables required](#environment-variables-required)
- [How to run the project](#how-to-run-the-project)
- [How to run tests](#how-to-run-tests)
- [Basic usage instructions](#basic-usage-instructions)
- [Documentation](#documentation)

---

## Main features

- **Interactive Tehran map** for choosing origin and destination
- **Shortest route calculation with Dijkstra's algorithm** on a simplified road
  graph, drawn as a polyline on the map
- **Distance, estimated duration and estimated price** shown before ordering
- **Automatic nearest-driver assignment** when a ride is requested from the map
- Complete ride lifecycle: request → accept → start → complete (or cancel)
- Three separate panels: Passenger, Driver and Admin
- Session-based authentication with hashed passwords and role-based access
- **Light and Dark mode** with a toggle in the navigation bar
- Public **landing page** for visitors who are not logged in
- Responsive layout (desktop, tablet, mobile) built with plain CSS
- UI polish: finding-driver animation, ride status tracker, toast
  notifications, simulated driver movement, completion animation and
  friendly empty states
- 82 unit tests (Jest) covering the ride rules, routing, pricing and access control

---

## Available user roles

The system has exactly **three roles**, stored in the `users` table:

| Role | Description | Can access |
|------|-------------|------------|
| `PASSENGER` | Requests rides and follows their status | `/passenger/*` |
| `DRIVER` | Accepts and completes rides | `/driver/*` |
| `ADMIN` | Manages users and observes statistics | `/admin/*` |

Visitors register as **Passenger** or **Driver** (Admin cannot be self-registered).
Role-based access control is enforced on the server for every protected page and
action — a passenger cannot open driver or admin pages, and a driver cannot open
admin pages (HTTP 403).

### Demo accounts

All accounts are created by the seed script with these credentials:

| Role      | Email                  | Password     | Simulated location |
|-----------|------------------------|--------------|--------------------|
| Admin     | admin@taxi.local       | admin123     | —                  |
| Driver    | driver@taxi.local      | driver123    | Vanak              |
| Driver    | driver2@taxi.local     | driver123    | Tajrish            |
| Driver    | driver3@taxi.local     | driver123    | Azadi              |
| Driver    | driver4@taxi.local     | driver123    | Sadeghieh          |
| Passenger | passenger@taxi.local   | passenger123 | —                  |

---

## Landing page

The root URL (`/`) shows a **public landing page** to visitors who are not
logged in, so the application opens with a welcome screen instead of a login
form. It contains:

- A hero section ("Your Ride, One Click Away.") with **Get Started** and
  **Login** buttons
- A decorative Tehran map card built entirely with CSS (no images)
- Three feature cards: Easy Ride Request, Smart Route, Fast Driver Assignment
- A trust section: Easy booking, Smart routing, Simulated driver matching

A visitor can open it without an account. A logged-in user visiting `/` is
still sent to the dashboard for their role.

---

## Passenger panel

| Page | URL | What it does |
|------|-----|--------------|
| Dashboard | `/passenger/dashboard` | Number of current rides, number of completed rides, and the 5 most recent rides with status badges |
| My Rides | `/passenger/rides` | Full list of personal rides with distance, price and status; cancel button for cancellable rides; link to each ride's details |
| Request Taxi | `/passenger/rides/new` | The Tehran map page: select origin and destination, calculate the route, see the estimates and submit the request |
| Ride details | `/passenger/rides/:id` | Origin, destination, assigned driver, distance, estimated duration, estimated price, status and all timestamps, plus a map with the route, both markers and the driver |

The passenger can also request a ride **without the map** by typing origin and
destination as text; that ride becomes `REQUESTED` and any driver can accept it
manually.

---

## Driver panel

| Page | URL | What it does |
|------|-----|--------------|
| Dashboard | `/driver/dashboard` | Completed-ride count, available requests, own simulated location, the current assigned ride with its status tracker, and a map showing the driver, the pickup point, the destination and the route |
| My Rides | `/driver/rides` | Ride history with passenger, route, distance, price and status |
| Ride details | `/driver/rides/:id` | Same detail view as for passengers, with the action buttons for the ride |

Available actions (only shown when valid for the current status):

- **Accept** a `REQUESTED` ride
- **Start** an `ACCEPTED` ride
- **Complete** a `STARTED` ride
- **Cancel** an `ACCEPTED` ride

A driver can only act on rides assigned to them; attempting to start, complete
or cancel another driver's ride is rejected.

---

## Admin panel

| Page | URL | What it does |
|------|-----|--------------|
| Dashboard | `/admin/dashboard` | System statistics: total users, drivers, passengers, total rides, completed rides, cancelled rides |
| Users | `/admin/users` | All users with role and active status, plus deactivate / activate buttons |
| Rides | `/admin/rides` | Every ride in the system with passenger, driver, route, distance, price, status and time |

An admin **cannot deactivate their own account** (the system blocks it). When a
user is deactivated they can no longer log in, and an already-open session is
terminated on the next request.

---

## Authentication

- **Session-based** authentication using `express-session` — no JWT
- Passwords are hashed with **bcrypt** and never stored as plain text
- After login, the user's id, name, email and role are kept in the session
- Two middleware guards enforce access: `requireAuth` (must be logged in and
  active) and `requireRole` (must have one of the allowed roles)
- Deactivated accounts are rejected at login and on every subsequent request
- The session cookie is `HttpOnly` and `SameSite=Lax`
- The session secret comes from the `SESSION_SECRET` environment variable
- Logout destroys the session (`/logout`)

Registration validates the name, email format and a minimum password length of
6 characters, and rejects duplicate email addresses.

---

## Taxi request workflow

1. The passenger opens **Request Taxi** and selects two points on the Tehran map
   (or types the addresses as text).
2. The passenger clicks **Calculate Route**; the system snaps both points to the
   nearest nodes of the road graph, runs Dijkstra, draws the shortest path as a
   green polyline and shows the distance, estimated time and estimated price.
3. The passenger clicks **Request Taxi**. An animated "finding a driver" overlay
   appears, then changes to "✓ Driver Found" with the assigned driver's name.
4. The **nearest available driver is assigned automatically** and the ride is
   created with the status `ACCEPTED`.
5. The driver opens the dashboard, sees the ride on the map and clicks
   **Start Ride**, then **Complete Ride**.
6. The passenger's ride details page updates (it also polls the status every few
   seconds while the ride is active) and finally shows the completed ride with a
   celebration card.

If no driver is available at step 4, the ride stays `REQUESTED` and any driver
can accept it manually.

---

## Ride statuses

Exactly five statuses exist. Only these transitions are allowed — everything
else is rejected by the service layer:

```
REQUESTED ──► ACCEPTED ──► STARTED ──► COMPLETED
    │              │
    └──────────────┴──────► CANCELLED
```

| Status | Meaning |
|--------|---------|
| `REQUESTED` | The passenger created the request; no driver yet |
| `ACCEPTED` | A driver is assigned (manually or automatically) |
| `STARTED` | The driver picked up the passenger and the ride is running |
| `COMPLETED` | The ride finished (final state) |
| `CANCELLED` | Cancelled from `REQUESTED` or `ACCEPTED` (final state) |

Every transition stores its own timestamp (`accepted_at`, `started_at`,
`completed_at`, `cancelled_at`).

---

## Tehran map (Leaflet / OpenStreetMap)

- **Leaflet** renders the map; the library is stored locally in
  `public/vendor/leaflet/` so no CDN is needed.
- **OpenStreetMap** provides the map tiles — free, no API key, no paid service.
  The required "© OpenStreetMap contributors" attribution is shown on every map.
- The map appears on the request page, on both ride-details pages and on the
  driver dashboard.

Markers used on the map:

| Marker | Appearance | Meaning |
|--------|-----------|---------|
| Origin | Green pin with "A" | Pickup point |
| Destination | Red pin with "B" | Drop-off point |
| Driver | Dark taxi pin 🚕 | Simulated driver location |

Selected points can be dragged to adjust them, and **Reset** clears the
selection. The map works in both light and dark mode (the tiles are
color-inverted with a CSS filter while markers and the route keep their colors).

---

## Routing — Dijkstra shortest path

The routing runs **on the server** in `src/services/routingService.js` using a
deliberately small graph of the Tehran road network in `src/data/tehranGraph.js`:

- **13 nodes** — Azadi, Sadeghieh, Mehrabad Airport, Enghelab, Valiasr,
  Ferdowsi, Vanak, Tajrish, Resalat, Haft-e Tir, Imam Hossein,
  Darvazeh Shemiran and Rah Ahan
- **20 edges** — roads between them with approximate distances in kilometers

The algorithm:

1. Both selected coordinates are snapped to the nearest graph node (Haversine
   distance).
2. **Dijkstra's shortest path** finds the shortest route between those two nodes.
3. The total distance is the walking distance to the first node + the graph path
   + the distance from the last node to the exact destination.
4. The result is returned with the ordered node list and a polyline for the map.

Because the graph is small, Dijkstra is implemented with a simple
"pick the nearest unvisited node" loop instead of a priority queue — this keeps
the code readable and easy to explain while still being the real algorithm.

**Fallback:** if a selected point is more than 20 km from every graph node (or
the snapped nodes are not connected), the straight-line **Haversine** distance is
used instead and the page shows a friendly note. Invalid or missing coordinates
are rejected with a clear message; the application never crashes.

---

## Distance, duration and price calculation

All values are configured in one place, `src/config.js`:

| Constant                | Default | Meaning                                   |
|-------------------------|---------|-------------------------------------------|
| `BASE_FARE`             | 50000   | Fixed starting amount (Toman)             |
| `PRICE_PER_KM`          | 10000   | Cost per kilometer (Toman)                |
| `ROUND_TO`              | 1000    | Round the final price to this step        |
| `AVERAGE_SPEED_KMH`     | 30      | Average city speed, used for the duration |
| `MAX_SNAP_DISTANCE_KM`  | 20      | Beyond this, use the straight-line fallback |

```
price    = BASE_FARE + distanceKm × PRICE_PER_KM     (rounded to ROUND_TO)
duration = distanceKm ÷ AVERAGE_SPEED_KMH            (in minutes, minimum 1)
```

Example: a 8.4 km ride costs 50,000 + 84,000 = **134,000 Toman** and takes about
**17 minutes**.

The calculated distance, duration and price are **stored with the ride**, so the
amount shown to the passenger, the driver and the admin is always the same and
does not change if the configuration is edited later.

There is no surge pricing, no traffic multiplier, no discounts and no payment
processing — by design.

---

## Driver assignment

The matching is intentionally the simplest possible (in
`src/services/driverService.js`):

1. Load all available drivers — active accounts that have a simulated location
   and no ride currently in `ACCEPTED` or `STARTED`.
2. Compute the straight-line (Haversine) distance from the passenger's pickup
   point to each available driver.
3. Assign the **nearest** driver to the ride and create the ride directly as
   `ACCEPTED`.
4. The assigned driver appears on the passenger's ride details map.

The four demo drivers have fixed simulated positions (Vanak, Tajrish, Azadi,
Sadeghieh). These are **not real GPS** — they never change while the
application runs. When no driver is available the ride stays `REQUESTED` and can
still be accepted manually.

---

## Light / Dark mode

A toggle button in the navigation bar (🌙 Dark / ☀️ Light) switches the whole
interface between the two themes. The choice is saved in `localStorage`, so it
survives page reloads and navigation, and it is applied before the first paint by
a small inline script so there is no white flash when loading a dark page.

| | Light | Dark |
|-|-------|------|
| Page background | light gray `#f4f7f9` | near-black gray `#161a1d` |
| Cards / navbar | white `#ffffff` | dark gray `#1f262b` |
| Text | dark `#17212b` | light `#e8edf2` |
| Accent | green `#00b074` | brighter green `#22c55e` |

Everything is driven by CSS variables in `public/css/style.css` (`:root` holds
the light theme, `[data-theme="dark"]` overrides the same variables);
`public/js/theme.js` only reads/saves the preference and sets the attribute.
The map also adapts: OpenStreetMap tiles are color-inverted with a CSS filter
while markers, the route polyline and driver locations keep their colors.

This is a frontend-only feature — no database column, no API endpoint and no
backend logic.

---

## Animations and UI

All animations use CSS keyframes and Vanilla JavaScript only — **no animation
library**. They respect the user's system setting via
`@media (prefers-reduced-motion: reduce)` and are styled with the same CSS
variables, so they work in both themes.

| Feature | Where | What it does |
|---------|-------|--------------|
| Finding a driver | Request taxi page | A pulsing 🚕 "Finding a driver…" overlay that switches to "✓ Driver Found" with the driver's name |
| Ride status tracker | Ride details, driver dashboard | A 4-step tracker (📝 Requested → 🚕 Driver Found → 🟢 Ride Started → 🏁 Completed) with finished steps ticked and the current step highlighted |
| Toast notifications | Every page | A reusable `showToast(message, type)` component (success / error / warning / info) that slides in and auto-dismisses; server flash messages are converted to toasts automatically |
| Simulated driver movement | Ride map | The driver marker is interpolated smoothly to the pickup point (and to the destination when the ride is running) — a visual simulation only, no GPS |
| Completion animation | Ride details | A 🎉 "Ride Completed!" card that fades and scales in |
| Empty states | Ride lists and dashboards | Friendly icon, title, message and a call-to-action button |
| Transitions | Buttons, cards, navigation | Short hover, active and focus transitions (0.12–0.28 s) |

---

## Technology stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Web framework | Express.js |
| Database | PostgreSQL (driver: `pg`) |
| Templates | EJS (server-side rendering) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Map | Leaflet + OpenStreetMap (served locally, free, no API key) |
| Routing | Own Dijkstra implementation on a simplified graph |
| Session / security | express-session, bcrypt |
| Configuration | dotenv |
| Tests | Jest |

**Deliberately not used:** no ORM, no frontend framework (React/Vue/Tailwind/
Bootstrap), no TypeScript, no Docker, no WebSockets, no external paid APIs.

---

## Project structure overview

```
university_project/
│
├── src/
│   ├── app.js                 # Express application (middleware + routes)
│   ├── server.js              # Entry point, starts the server
│   ├── config.js              # .env values + pricing and routing constants
│   ├── constants.js           # Roles, ride statuses, allowed transitions
│   ├── errors.js              # AppError class
│   │
│   ├── data/
│   │   └── tehranGraph.js     # Simplified Tehran road graph (nodes + edges)
│   │
│   ├── routes/                # URL definitions per role + JSON API
│   ├── controllers/           # Handle request/response, call services
│   ├── services/
│   │   ├── authService.js     # Registration and login rules
│   │   ├── rideService.js     # Ride workflow + map requests + assignment
│   │   ├── routingService.js  # Dijkstra shortest path, nearest node, fallback
│   │   ├── pricingService.js  # Price and duration estimation
│   │   ├── driverService.js   # Driver locations + nearest driver selection
│   │   └── adminService.js    # Statistics and user management
│   ├── repositories/          # SQL queries (parameterized)
│   ├── middleware/            # Authentication, error handling
│   ├── utils/                 # Validators, formatters, geo (Haversine)
│   └── db/                    # Connection pool, setup + migration scripts
│
├── views/                     # EJS templates
│   ├── landing.ejs            # Public landing page
│   ├── partials/              # Header, footer, status badge, status tracker
│   ├── auth/                  # Login, register
│   ├── passenger/             # Dashboard, rides, new ride (map), ride details
│   ├── driver/                # Dashboard (map), rides, ride details (map)
│   ├── admin/                 # Admin pages
│   └── errors/                # Error page
│
├── public/
│   ├── css/style.css          # Theme variables, layout, animations
│   ├── js/                    # theme, toast, map helpers, page scripts
│   └── vendor/leaflet/        # Leaflet library (served locally)
│
├── tests/                     # Jest unit tests (7 suites)
│
├── database/
│   ├── schema.sql             # Table definitions (fresh install)
│   ├── seed.sql               # Demo accounts, driver locations, rides
│   ├── migrations/            # Idempotent migrations for existing databases
│   └── README.md              # Database setup notes
│
├── docs/                      # Full project documentation (see below)
├── HOW_TO_USE.txt             # Simple step-by-step user guide
├── package.json
├── .env.example
└── README.md
```

### Architecture

```
Browser  (Leaflet map, small Vanilla JS)
   │  HTTP (forms, links, fetch)
   ▼
Express Routes  (HTML pages + JSON API)
   │
   ▼
Controllers
   │
   ▼
Services  (business rules, validation, status workflow,
           Dijkstra routing, pricing, driver selection)
   │
   ▼
Repositories  (parameterized SQL)
   │
   ▼
PostgreSQL
```

### Database tables

| Table | Purpose |
|-------|---------|
| `users` | Accounts: name, email, bcrypt password hash, role, active flag |
| `rides` | Ride requests: passenger, driver, origin/destination, coordinates, status, distance, duration, price and all transition timestamps |
| `driver_locations` | Simulated map locations of the demo drivers (one row per driver) |

All SQL queries use parameterized statements (`$1`, `$2`, …).

---

## Installation requirements

- **Node.js** 18 or newer (developed with Node 24)
- **npm**
- **PostgreSQL** 14 or newer (developed with PostgreSQL 18)
- A modern web browser
- Internet access for the OpenStreetMap map tiles (the application itself runs
  offline; only the map background images need the network)

---

## PostgreSQL setup

1. Make sure a PostgreSQL server is running.

2. Create the application database:

   ```
   createdb -U postgres taxi_system
   ```

3. Copy the environment template and fill in your database credentials:

   ```
   cp .env.example .env
   ```

   On Windows Command Prompt use `copy .env.example .env` instead.

4. Create the tables and the demo data:

   ```
   npm run db:setup
   ```

   This runs `database/schema.sql` (tables and indexes) followed by
   `database/seed.sql` (demo accounts, driver locations and example rides).

For an **existing** database that was created before the map feature, apply the
extension instead — this keeps all data:

```
npm run db:migrate
```

The files in `database/migrations/` are idempotent (`ADD COLUMN IF NOT EXISTS`,
`ON CONFLICT DO NOTHING`), so they can be run repeatedly without hurting data.

See `database/README.md` for details, including the option of a dedicated
project-local PostgreSQL instance.

---

## Environment variables required

All configuration is read from `.env` (which is **never committed** — it is
listed in `.gitignore`). Copy `.env.example` and adjust:

| Variable         | Description                            | Example         |
|------------------|----------------------------------------|-----------------|
| `PORT`           | Web server port                        | `3000`          |
| `DB_HOST`        | PostgreSQL host                        | `localhost`     |
| `DB_PORT`        | PostgreSQL port                        | `5432`          |
| `DB_NAME`        | Database name                          | `taxi_system`   |
| `DB_USER`        | Database user                          | `postgres`      |
| `DB_PASSWORD`    | Database password                      | `your_password` |
| `SESSION_SECRET` | Secret used to sign the session cookie | `change_me`     |

---

## How to run the project

```
npm install     # install the dependencies
npm run db:setup   # create the tables and demo data (first time only)
npm start       # start the application
```

Then open **http://localhost:3000** in the browser.

You will see the landing page. Log in with one of the demo accounts, or register
a new passenger or driver account.

---

## How to run tests

```
npm test
```

Runs the Jest unit tests (7 suites, **82 tests**). The tests do not need a
running database — the repository layer is mocked — so they can be run at any
time.

Covered areas: ride status transitions, ride business rules (create, accept,
start, complete, cancel), map coordinates and driver assignment, Haversine
distance, Dijkstra shortest path, pricing and duration formulas, and
authentication / role access control.

---

## Basic usage instructions

A short version of the walkthrough (the full step-by-step guide with every
button is in `HOW_TO_USE.txt`):

**As a passenger**

1. Log in as `passenger@taxi.local` / `passenger123`.
2. Click **Request Taxi**.
3. Click **📍 Select Origin** and click a point on the map, then click
   **🏁 Select Destination** and click a second point (or drag the pins).
4. Click **Calculate Route** — the route line appears with the distance,
   estimated time and estimated price.
5. Click **Request Taxi 🚕** — the system finds the nearest driver and shows the
   ride details with the driver on the map.
6. Follow the status in **My Rides**; cancel a ride while it is still
   `REQUESTED` or `ACCEPTED`.

**As a driver**

1. Log in as one of the driver accounts (`driver@taxi.local` / `driver123`).
2. The dashboard shows the assigned ride, the pickup point, the destination and
   the route on the map.
3. Click **Start Ride**, then **Complete Ride** when the trip is finished.
   Open requests (plain text rides) can be taken with **Accept**.

**As an admin**

1. Log in as `admin@taxi.local` / `admin123`.
2. The dashboard shows system statistics.
3. **Users** lists every account and allows deactivating or activating a user.
4. **Rides** lists every ride in the system.

You can switch the theme at any time with the **🌙 Dark / ☀️ Light** button in
the navigation bar, and log out with the **Logout** link.

---

## Documentation

The full project documentation is in `docs/`:

| File | Contents |
|------|----------|
| `proposal.md` | Project proposal and scope |
| `srs.md` | Software requirements specification |
| `use-cases.md` | Use case, activity and access-matrix documentation |
| `architecture.md` | Architecture, class, sequence and data-flow diagrams |
| `database.md` | ER diagram and schema description |
| `routing.md` | Map (Leaflet/OpenStreetMap), Dijkstra routing, pricing and driver assignment |
| `testing.md` | Test cases and how to run the tests |
| `bug-report.md` | Bugs found during development and their fixes |
| `code-review.md` | Code review checklist and findings |

Additional guides:

- `HOW_TO_USE.txt` — a simple plain-text guide covering every account, page and
  workflow
- `database/README.md` — database setup notes
