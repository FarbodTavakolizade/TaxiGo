# Database Design

## 1. Overview

The system uses exactly two tables: `users` and `rides`. No additional tables
are needed for the requested scope.

- The schema is defined in `database/schema.sql`.
- Demo data for all roles is defined in `database/seed.sql`.
- Both are executed by `npm run db:setup`.

## 2. Entity relationship diagram

```mermaid
erDiagram
    USERS {
        serial   id PK
        varchar  name
        varchar  email UK
        varchar  password "bcrypt hash"
        varchar  role "PASSENGER | DRIVER | ADMIN"
        boolean  is_active
        timestamp created_at
    }

    RIDES {
        serial   id PK
        integer  passenger_id FK
        integer  driver_id FK "nullable until accepted"
        varchar  origin
        varchar  destination
        varchar  status "REQUESTED | ACCEPTED | STARTED | COMPLETED | CANCELLED"
        timestamp created_at
        timestamp accepted_at "nullable"
        timestamp started_at "nullable"
        timestamp completed_at "nullable"
        timestamp cancelled_at "nullable"
    }

    USERS ||--o{ RIDES : "requests (passenger_id)"
    USERS |o--o{ RIDES : "drives (driver_id)"
```

Relationship descriptions:

- One user (passenger) can have many rides: `rides.passenger_id → users.id`
  (always present).
- One user (driver) can be assigned to many rides: `rides.driver_id → users.id`
  (NULL until a driver accepts).

## 3. Table: users

| Column     | Type         | Constraints                                      |
|------------|--------------|--------------------------------------------------|
| id         | SERIAL       | Primary key                                      |
| name       | VARCHAR(100) | NOT NULL                                         |
| email      | VARCHAR(150) | NOT NULL, UNIQUE                                 |
| password   | VARCHAR(100) | NOT NULL (bcrypt hash, never plain text)         |
| role       | VARCHAR(20)  | NOT NULL, CHECK in (PASSENGER, DRIVER, ADMIN)    |
| is_active  | BOOLEAN      | NOT NULL, default TRUE                           |
| created_at | TIMESTAMP    | NOT NULL, default NOW()                          |

## 4. Table: rides

| Column       | Type         | Constraints                                              |
|--------------|--------------|----------------------------------------------------------|
| id           | SERIAL       | Primary key                                              |
| passenger_id | INTEGER      | NOT NULL, FK → users(id)                                 |
| driver_id    | INTEGER      | FK → users(id), NULL until a driver accepts              |
| origin       | VARCHAR(200) | NOT NULL                                                 |
| destination  | VARCHAR(200) | NOT NULL                                                 |
| status       | VARCHAR(20)  | NOT NULL, CHECK in the five statuses, default REQUESTED  |
| created_at   | TIMESTAMP    | NOT NULL, default NOW()                                  |
| accepted_at  | TIMESTAMP    | Set when the ride becomes ACCEPTED                       |
| started_at   | TIMESTAMP    | Set when the ride becomes STARTED                        |
| completed_at | TIMESTAMP    | Set when the ride becomes COMPLETED                      |
| cancelled_at | TIMESTAMP    | Set when the ride becomes CANCELLED                      |

Indexes:

- `idx_rides_passenger` on `passenger_id` (passenger ride list, statistics)
- `idx_rides_driver` on `driver_id` (driver history, active ride)
- `idx_rides_status` on `status` (available REQUESTED rides)

## 5. Design decisions

1. **Status as a text column with CHECK** – simple, readable in psql, and keeps
   the allowed values enforced by the database itself.
2. **Timestamps for every transition** – the history of a ride is visible
   without an extra audit table.
3. **driver_id nullable** – a ride exists before any driver is assigned,
   which matches the REQUESTED state.
4. **No separate "drivers" table** – driver-specific data is not required by
   the project scope; the role column is enough.
5. **is_active for deactivation** – accounts are never deleted, so ride
   history stays intact for the admin pages.

## 6. Concurrency

Accepting a ride uses a single conditional UPDATE:

```sql
UPDATE rides
SET driver_id = $1, status = 'ACCEPTED', accepted_at = NOW()
WHERE id = $2 AND status = 'REQUESTED' AND driver_id IS NULL
```

If two drivers accept at the same moment, only the first UPDATE matches a row;
the second receives 0 affected rows and the service reports that the ride was
already taken. The same conditional-update pattern is used for every status
transition (`WHERE id = $2 AND status = $3`).

## 7. Example queries used by the application

Available requests for the driver dashboard:

```sql
SELECT ... FROM rides r
JOIN users p ON p.id = r.passenger_id
LEFT JOIN users d ON d.id = r.driver_id
WHERE r.status = 'REQUESTED'
ORDER BY r.created_at ASC;
```

Admin ride statistics:

```sql
SELECT
  COUNT(*) AS total_rides,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_rides,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled_rides
FROM rides;
```

All queries in the application are parameterized (`$1`, `$2`, ...); no SQL
string is ever built from user input.
