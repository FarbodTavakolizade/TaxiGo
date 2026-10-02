# Taxi Request and Transportation Management System

**سامانه درخواست تاکسی و حمل‌ونقل**

A small web-based taxi request system built as a university project. Passengers
request rides, drivers accept and complete them, and an administrator can view
statistics and deactivate users.

The application is intentionally simple: server-rendered pages, a small
layered architecture, and a minimal dependency list.

---

## Features

**Passenger**

- Register and log in
- Create a taxi request with a text origin and destination
- See all personal ride requests and their current status
- Cancel a ride while it is still REQUESTED or ACCEPTED
- Dashboard with the number of current and completed rides

**Driver**

- Log in
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
- See all rides in the system

**General**

- Session-based authentication (express-session)
- Passwords hashed with bcrypt (never stored as plain text)
- Role-based access control (PASSENGER / DRIVER / ADMIN)
- Server-side validation with friendly error messages
- Centralized error handling (no stack traces shown to users)
- Ride status workflow strictly limited to the allowed transitions

---

## Technology stack

- Node.js
- Express.js
- PostgreSQL (driver: `pg`)
- EJS server-side templates
- HTML5, CSS3, Vanilla JavaScript
- express-session, bcrypt, dotenv
- Jest (unit tests)

No ORM, no frontend framework, no Docker, no external APIs.

---

## Requirements

- Node.js 18 or newer (developed with Node 24)
- npm
- PostgreSQL 14 or newer (developed with PostgreSQL 18)

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

Create the tables and demo data:

```
npm run db:setup
```

This runs `database/schema.sql` (tables and indexes) followed by
`database/seed.sql` (demo accounts and example rides). The script drops and
recreates both tables, so it can be executed repeatedly.

### Demo accounts

| Role      | Email                  | Password     |
|-----------|------------------------|--------------|
| Admin     | admin@taxi.local       | admin123     |
| Driver    | driver@taxi.local      | driver123     |
| Driver    | driver2@taxi.local     | driver123     |
| Passenger | passenger@taxi.local   | passenger123 |

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
│   ├── config.js              # Reads configuration from .env
│   ├── constants.js           # Roles, ride statuses, allowed transitions
│   ├── errors.js              # AppError class
│   │
│   ├── routes/                # URL definitions per role
│   ├── controllers/           # Handle request/response, call services
│   ├── services/              # Business rules
│   ├── repositories/          # SQL queries (parameterized)
│   ├── middleware/            # Authentication, error handling
│   ├── utils/                 # Validators, formatters
│   └── db/                    # Connection pool, setup script
│
├── views/                     # EJS templates
│   ├── partials/              # Header, footer, status badge
│   ├── auth/                  # Login, register
│   ├── passenger/             # Passenger pages
│   ├── driver/                # Driver pages
│   ├── admin/                 # Admin pages
│   └── errors/                # Error page
│
├── public/
│   ├── css/style.css          # Stylesheet
│   └── js/main.js             # Small Vanilla JavaScript helpers
│
├── tests/                     # Jest unit tests
│
├── database/
│   ├── schema.sql             # Table definitions
│   ├── seed.sql               # Demo accounts and example rides
│   └── README.md              # Database setup notes
│
├── docs/                      # University project documentation
│   ├── proposal.md
│   ├── srs.md
│   ├── use-cases.md
│   ├── architecture.md
│   ├── database.md
│   ├── testing.md
│   ├── bug-report.md
│   └── code-review.md
│
├── package.json
├── .env.example
└── README.md
```

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
Browser
   │  HTTP (forms, links)
   ▼
Express Routes
   │
   ▼
Controllers
   │
   ▼
Services  (business rules, validation, status workflow)
   │
   ▼
Repositories  (parameterized SQL)
   │
   ▼
PostgreSQL
```

See `docs/architecture.md` for diagrams (class, sequence, architecture).

---

## Documentation

The full university documentation is in `docs/`:

- `proposal.md` – project proposal and scope
- `srs.md` – software requirements specification
- `use-cases.md` – use case diagram and descriptions
- `architecture.md` – architecture, class and sequence diagrams
- `database.md` – ER diagram and schema description
- `testing.md` – test cases and how to run the tests
- `bug-report.md` – bugs found during development and their fixes
- `code-review.md` – code review checklist and findings
