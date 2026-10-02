# Code Review

A self-review of the code base against the project's code quality rules
(section 21 of the specification), plus findings and their resolution.

## 1. Checklist

| # | Rule                                        | Status | Notes                                                                 |
|---|---------------------------------------------|--------|-----------------------------------------------------------------------|
| 1 | Keep code readable                          | ✔      | Small functions, English comments where useful, no clever tricks     |
| 2 | Use meaningful variable names               | ✔      | `ride`, `passenger`, `availableRides`, `completedRides`, …            |
| 3 | Avoid duplicated code                       | ✔      | `driverTransition()` shared by start/complete/cancel; `RIDE_SELECT` shared by all ride reads; shared `status-badge.ejs` partial |
| 4 | Avoid unnecessary abstractions              | ✔      | Two repositories, three services, no factory/interface layers        |
| 5 | Add comments only where useful              | ✔      | Comments explain rules (workflow, flash, atomic updates), not syntax |
| 6 | Keep functions reasonably small             | ✔      | Largest function (`errorHandler`) is ~30 lines                       |
| 7 | Use async/await                             | ✔      | Every database call; no callbacks except `session.destroy`           |
| 8 | Handle database errors                      | ✔      | All route handlers are async and flow into the central error handler; pool has an `error` listener |
| 9 | Use parameterized SQL queries               | ✔      | Every query uses `$1, $2, …` placeholders                             |
| 10| Never build SQL from raw user input         | ✔      | No string interpolation of user data anywhere; the only interpolated SQL fragment is the internally chosen timestamp column name |
| 11| No business logic inside EJS                | ✔      | Templates only loop, render values and choose badges/buttons based on status |
| 12| No SQL inside route handlers                | ✔      | Routes only map URL → controller + middleware                         |

## 2. Architecture review

- Layering is strict and consistent: routes → controllers → services →
  repositories. Controllers never import `pool` directly; services never build
  SQL; templates never query.
- Access rules live in one place (`src/middleware/auth.js`) and are applied per
  router with a path-scoped `router.use(...)`.
- The ride workflow is defined once in `src/constants.js`
  (`ALLOWED_TRANSITIONS`) and enforced in `src/services/rideService.js`.
  The database reinforces the same rule with a CHECK constraint.
- `requireAuth` reloads the user row on every request. This is a deliberate
  trade-off: one extra query per request buys correct semantics for
  deactivation and role changes (an admin action takes effect immediately,
  including for already-open sessions).

## 3. Security review

| Topic              | Finding                                                                                          |
|--------------------|--------------------------------------------------------------------------------------------------|
| Password storage   | bcrypt with 10 rounds; hashes never selected into views (repositories select only needed columns) |
| SQL injection      | Fully parameterized queries; verified by searching for template literals in SQL                   |
| XSS                | EJS `<%= %>` escapes all dynamic output; the single `<%- include %>` usage includes trusted partials only |
| Session handling   | `httpOnly` + `sameSite=lax` cookie, 1-hour lifetime, secret from `.env`, session destroyed on logout |
| Authorization      | Role checks on the server for every protected page and action; ownership checks (ride belongs to the passenger/driver) inside services |
| Race conditions    | Ride acceptance and status changes use conditional `UPDATE … WHERE status = expected`, so concurrent requests cannot double-assign or skip states |
| Error disclosure   | Unexpected errors are logged server-side; users only see a generic message (no stack traces, no SQL) |

Known limitation (accepted for this project scope): there is no CSRF token.
`sameSite=lax` mitigates cross-site form posts; adding a CSRF library would
increase the dependency count beyond what this project needs.

## 4. Findings raised and fixed during review

1. **Router middleware leaked across routers** (driver pages 403). Fixed by
   scoping `router.use` to the role path. See `docs/bug-report.md` BUG-1.
2. **Login reused the registration password policy.** Fixed in
   `authService.login()`; wrong credentials now produce HTTP 401 with the
   correct message. See BUG-2.
3. **Grammar error in transition error message.** Fixed; covered by a unit
   test. See BUG-3.
4. **Flash messages implemented manually** to avoid an extra dependency
   (`connect-flash`); the helper lives in one middleware in `src/app.js` and
   is used consistently by controllers.
5. **Error handler fallback**: POST errors without a `Referer` header now
   redirect to the dashboard of the user's role instead of the site root,
   which previously could bounce a logged-in driver through `/` → dashboard
   and hide the flash message.

## 5. Suggestions deliberately NOT implemented (out of scope)

These would be reasonable in a production system but contradict the
"small university project" goal:

- Pagination / filtering for the admin ride list
- Database-backed session store (a memory store is fine for a local demo)
- CSRF tokens
- Soft-delete + audit log for rides
- Additional performance indexes and query analysis

## 6. Phase 2 review (map, routing, pricing)

Additional rules that were applied while extending the project:

| Rule                                                            | Status | Notes |
|-----------------------------------------------------------------|--------|-------|
| Reuse existing code instead of rewriting                        | ✔      | Services/repositories were extended, not replaced; the phase-1 ride workflow, routes and pages still work unchanged |
| Routing logic in a service, not in controllers or views         | ✔      | `routingService` (Dijkstra), `pricingService`, `driverService` |
| Pricing constants in one place                                  | ✔      | `src/config.js` (`BASE_FARE`, `PRICE_PER_KM`, `ROUND_TO`, `AVERAGE_SPEED_KMH`) |
| No business logic in EJS                                        | ✔      | Templates only render values; the map code lives in `public/js/` |
| Parameterized SQL only                                          | ✔      | The new `driverRepository` uses `$1` placeholders; no string-built queries |
| Database changes are non-destructive                            | ✔      | Idempotent migration with `ADD COLUMN IF NOT EXISTS` / `ON CONFLICT DO NOTHING`; verified by running it twice |
| Access control on the new endpoints                             | ✔      | All `/api/*` routes require a session; `/api/rides/:id` reuses the service-level ownership check (owner passenger or assigned driver only) |
| No real-time technology                                         | ✔      | Plain `fetch`; the ride details page polls `/api/rides/:id` every 4 seconds. No WebSockets, no queues |
| No real GPS                                                     | ✔      | Driver positions are fixed demo coordinates in `driver_locations` |
| New dependency justified                                        | ✔      | Only Leaflet was added (the client library for the required map); it is served from `public/vendor/` |
| The project stays small                                         | ✔      | 3 new small services, 1 graph data file, 4 browser JS files; no new layers or frameworks |

Additional findings fixed during the phase-2 review:

1. **`express.json()` was missing** – the JSON API returned 500 for every
   request. Fixed in `app.js`. See `docs/bug-report.md` BUG-4.
2. **Dijkstra accepted non-existent node ids** – added an explicit guard;
   found by a unit test. See BUG-5.
3. **API errors were rendered as HTML redirects** – the central error handler
   now returns JSON (`{ "error": "..." }`) for `/api/*` paths, so the map code
   can display the real message.
4. **Ride details access had to be narrow** – the new page needs to be visible
   to the owning passenger *and* the assigned driver, but nobody else; this is
   enforced once in `rideService.getRideDetails()` and reused by the page and
   the JSON endpoint.

Known limitation (accepted for this project scope): the tile images come from
the public OpenStreetMap server, so the map background needs internet access
at demo time. The application itself, including routing, pricing and the
database, runs fully offline.

## 7. Conclusion

The code base matches the requested scope: small, readable, layered, with
parameterized SQL, hashed passwords, strict role checks and a single source of
truth for the ride workflow. Automated tests cover the required business rules
(34 tests passing), and the two real defects found during development are
documented and fixed.
