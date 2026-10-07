# Taxi Request and Transportation Management System

**سامانه درخواست تاکسی و حمل‌ونقل**

A small web-based taxi request system built as a university project. Passengers
request rides, drivers accept and complete them, and an administrator can view
statistics and deactivate users.

The system includes an **interactive Tehran map** (Leaflet + OpenStreetMap),
a **Dijkstra routing algorithm** on a simplified road graph, a simple
**price and duration estimation**, and **automatic nearest-driver
assignment**.

The application is intentionally simple: server-rendered pages, a small
layered architecture, and a minimal dependency list.

---

## Features

**Landing page**

- Public welcome page at `/` (hero, feature cards, trust section)
- Guests see it before logging in; logged-in users keep going straight to
  their dashboard
- "Get Started" / "Register" open the register page, "Login" opens the login page

**Passenger**

- Register and log in
- **Select origin and destination on an interactive Tehran map**
- **Calculate the shortest route (Dijkstra) and see distance, estimated
  duration and estimated price before requesting**
- Request a taxi; the **nearest available driver is assigned automatically**
- See all personal ride requests and their current status
- **Ride details page with a map** (origin, destination, assigned driver and route)
- Cancel a ride while it is still REQUESTED or ACCEPTED
- Dashboard with the number of current and completed rides

**Driver**

- Log in
- **See the assigned ride on a map** (own location, pickup, destination, route)
- See all available ride requests
- Accept a request
- Start the accepted ride
- Complete the started ride
- Cancel an accepted ride
- See personal ride history and completed ride count

**Admin**

- Log in
- See system statistics (users, drivers, passengers, rides, completed, cancelled)
- See all users
- Deactivate / activate users
- See all rides in the system, including distance and price

**General**

- Session-based authentication (express-session)
- Passwords hashed with bcrypt (never stored as plain text)
- Role-based access control (PASSENGER / DRIVER / ADMIN)
- Server-side validation with friendly error messages
- Centralized error handling (no stack traces shown to users)
- Ride status workflow strictly limited to the allowed transitions
- Green/white taxi-app interface (plain CSS3, responsive, no frameworks)
- **Light and Dark mode** with a toggle in the navigation bar (saved in
  `localStorage`; frontend only, no database or backend involvement)
- **UI polish**: animated "finding a driver" state, ride status tracker,
  toast notifications, simulated driver movement on the map, completion
  animation and friendly empty states

---

## Technology stack

- Node.js
- Express.js
- PostgreSQL (driver: `pg`)
- EJS server-side templates
- HTML5, CSS3, Vanilla JavaScript
- **Leaflet + OpenStreetMap** (served locally, free, no API key)
- express-session, bcrypt, dotenv
- Jest (unit tests)

No ORM, no frontend framework, no Docker, no external APIs beyond the free
OpenStreetMap tiles.

---

## Requirements

- Node.js 18 or newer (developed with Node 24)
- npm
- PostgreSQL 14 or newer (developed with PostgreSQL 18)
- Internet access for the OpenStreetMap map tiles (the app itself runs
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

See `database/README.md` for details, including the option of a dedicated
project-local PostgreSQL instance.

## Database setup

For a **new** installation, create the tables and demo data:

```
npm run db:setup
```

This runs `database/schema.sql` (tables and indexes) followed by
`database/seed.sql` (demo accounts and example rides). The script drops and
recreates the tables, so it can be executed repeatedly.

For an **existing** database from the first phase, apply the map/price
extension instead – it keeps all data:

```
npm run db:migrate
```

The migrations in `database/migrations/` are idempotent, so running them
again is safe.

### Demo accounts

| Role      | Email                  | Password     | Simulated location |
|-----------|------------------------|--------------|--------------------|
| Admin     | admin@taxi.local       | admin123     | -                  |
| Driver    | driver@taxi.local      | driver123    | Vanak              |
| Driver    | driver2@taxi.local     | driver123    | Tajrish            |
| Driver    | driver3@taxi.local     | driver123    | Azadi              |
| Driver    | driver4@taxi.local     | driver123    | Sadeghieh          |
| Passenger | passenger@taxi.local   | passenger123 | -                  |

---

## Environment variables

All configuration is read from `.env` (never committed). Copy
`.env.example` and adjust:

| Variable         | Description                          | Example          |
|------------------|--------------------------------------|------------------|
| `PORT`           | Web server port                      | `3000`           |
| `DB_HOST`        | PostgreSQL host                      | `localhost`      |
| `DB_PORT`        | PostgreSQL port                      | `5432`           |
| `DB_NAME`        | Database name                        | `taxi_system`    |
| `DB_USER`        | Database user                        | `postgres`       |
| `DB_PASSWORD`    | Database password                    | `your_password`  |
| `SESSION_SECRET` | Secret used to sign the session cookie | `change_me`    |

---

## Installation

```
npm install
```

## Running the application

```
npm start
```

Then open:

```
http://localhost:3000
```

Log in with one of the demo accounts above, or register a new passenger or
driver account.

## Test commands

```
npm test
```

Runs the Jest unit tests (ride workflow rules, validation, access control).

---

## Project structure

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
│   ├── partials/              # Header, footer, status badge
│   ├── auth/                  # Login, register
│   ├── passenger/             # Dashboard, rides, new ride (map), ride details
│   ├── driver/                # Dashboard (map), rides, ride details (map)
│   ├── admin/                 # Admin pages
│   └── errors/                # Error page
│
├── public/
│   ├── css/style.css          # Taxi-app stylesheet: light + dark themes,
│   │                          # animations, toasts, status tracker
│   ├── js/
│   │   ├── main.js            # Confirm dialogs
│   │   ├── theme.js           # Light/dark toggle (localStorage)
│   │   ├── toast.js           # Toast notification component
│   │   ├── map-utils.js       # Shared Leaflet helpers
│   │   ├── request-map.js     # Origin/destination selection + route button
│   │   │                      # + "finding a driver" animation
│   │   └── ride-view.js       # Ride map, status polling, driver movement
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
├── docs/                      # University project documentation
│   ├── proposal.md
│   ├── srs.md
│   ├── use-cases.md
│   ├── architecture.md
│   ├── database.md
│   ├── routing.md             # Map, Dijkstra, pricing, driver assignment
│   ├── testing.md
│   ├── bug-report.md
│   └── code-review.md
│
├── package.json
├── .env.example
└── README.md
```

---

## Pricing and routing configuration

Both live in `src/config.js`, in a single place:

| Constant          | Default | Meaning                                  |
|-------------------|---------|------------------------------------------|
| BASE_FARE         | 50000   | Fixed starting amount (Toman)            |
| PRICE_PER_KM      | 10000   | Cost per kilometer (Toman)               |
| ROUND_TO          | 1000    | Round the final price to this step       |
| AVERAGE_SPEED_KMH | 30      | Used to estimate the travel time         |
| MAX_SNAP_DISTANCE_KM | 20   | Beyond this, use straight-line fallback  |

```
price    = BASE_FARE + distanceKm × PRICE_PER_KM
duration = distanceKm / AVERAGE_SPEED_KMH   (minutes)
```

See `docs/routing.md` for the routing algorithm, the map details and the
driver assignment.

---

## Light and Dark mode

A toggle button in the navigation bar (🌙 Dark / ☀️ Light) switches the whole
interface between the two themes. The choice is saved in `localStorage`, so it
survives page reloads and navigation, and it is applied before the first paint
by a small inline script so there is no white flash when loading a dark page.

| | Light | Dark |
|-|-------|------|
| Page background | light gray `#f4f7f9` | near-black gray `#161a1d` |
| Cards / navbar | white `#ffffff` | dark gray `#1f262b` |
| Text | dark `#17212b` | light `#e8edf2` |
| Accent | green `#00b074` | brighter green `#22c55e` |
| Buttons | white text on green | dark text on green (readable contrast) |

Everything is driven by CSS variables defined in `public/css/style.css`:
`:root` holds the light theme, `[data-theme="dark"]` overrides the same
variables. `public/js/theme.js` only reads/saves the preference and sets the
`data-theme` attribute on `<html>`.

The map keeps working in dark mode: the OpenStreetMap tiles are color-inverted
with a CSS filter, while markers, the route polyline and driver locations keep
their colors. Leaflet zoom buttons, popups and the attribution are restyled to
match. Only the map container and controls are affected — no map library,
marker or routing code was changed.

This feature is purely frontend (CSS variables, Vanilla JavaScript,
`localStorage`). It adds no dependency, no database column, no API endpoint and
no backend logic.

---

## UI polish (animations and notifications)

Small frontend touches that make the demo feel finished. All of them reuse the
existing pages, routes and data — no backend logic was changed.

| Feature | Where | What it does |
|---------|-------|--------------|
| Finding a driver | Request taxi page | While the request is submitted, an overlay shows a pulsing 🚕 "Finding a driver..." then switches to "✓ Driver Found" with the assigned driver's name before opening the ride |
| Status tracker | Ride details (passenger + driver), driver dashboard | A 4-step tracker (📝 Requested → 🚕 Driver Found → 🟢 Ride Started → 🏁 Completed) with the current step highlighted and finished steps ticked |
| Toast notifications | Every page | One reusable `showToast(message, type)` component (success / error / warning / info). Server flash messages are converted to toasts automatically, so existing actions get notifications without backend changes |
| Driver movement | Ride map | The driver marker is interpolated smoothly from its location to the pickup point (and to the destination when the ride is running). This is a **visual simulation only** — no GPS, no WebSockets, no database writes |
| Completion animation | Ride details | A 🎉 "Ride Completed!" card fades and scales in when the ride finishes |
| Empty states | Ride lists, dashboards | Friendly icon + title + message (and a call-to-action button where useful) instead of plain text |
| Button/card/nav transitions | Everywhere | Short hover, active and focus transitions (0.12–0.28s) |

All animations use CSS keyframes and Vanilla JavaScript only — no animation
library. They respect the user's system setting via
`@media (prefers-reduced-motion: reduce)`, and every new component is styled
with the same CSS variables, so it looks correct in both light and dark mode.

---

## Demo walkthrough

A complete demonstration of the system (three browser windows, or three
incognito tabs):

1. **Passenger** logs in as `passenger@taxi.local` → *Request Taxi*.
   On the Tehran map, click a point for the origin and another for the
   destination (markers A and B appear). The available drivers are shown as
   small taxi markers.
2. Click **Calculate Route** → the shortest path (Dijkstra) is drawn as a
   green line, and Distance / Estimated time / Estimated price appear.
   Optionally click **Reset** to show what happens with a new selection.
3. Click **Request Taxi** → the nearest available driver is assigned
   automatically, the page shows the ride details with the driver marker,
   and the status is ACCEPTED.
4. **Driver** logs in as the assigned driver (`driver3@taxi.local` for a
   pickup near Azadi) → dashboard shows the current ride on a map with the
   route to the passenger → **Start Ride** → **Complete Ride**.
5. **Passenger** refreshes the ride details page → status badge shows
   COMPLETED next to the map (it also updates by itself every few seconds
   while the ride is active).
6. **Admin** logs in as `admin@taxi.local` → dashboard shows the updated
   statistics → *Rides* shows distance and price for every ride.

Invalid actions to demonstrate as well: accepting an already accepted ride,
cancelling a started ride, a passenger opening an admin URL (403), and
selecting a point far outside Tehran to see the straight-line fallback
message.

A plain text request without the map still works: type origin and
destination and submit – the ride becomes REQUESTED and any driver can
accept it manually (the original phase-1 workflow).

---

## Ride status workflow

```
REQUESTED ──► ACCEPTED ──► STARTED ──► COMPLETED
    │              │
    └──────────────┴──────► CANCELLED
```

Only these transitions are allowed; everything else is rejected by the
service layer.

---

## Architecture

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

See `docs/architecture.md` for diagrams (class, sequence, architecture)
and `docs/routing.md` for the map and routing design.

---

## Documentation

The full university documentation is in `docs/`:

- `proposal.md` – project proposal and scope
- `srs.md` – software requirements specification
- `use-cases.md` – use case and activity diagrams with descriptions
- `architecture.md` – architecture, class and sequence diagrams
- `database.md` – ER diagram and schema description
- `routing.md` – map (Leaflet/OpenStreetMap), Dijkstra routing, pricing,
  driver assignment
- `testing.md` – test cases and how to run the tests
- `bug-report.md` – bugs found during development and their fixes
- `code-review.md` – code review checklist and findings

