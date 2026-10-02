-- =====================================================================
-- Taxi Request and Transportation Management System
-- Database schema (PostgreSQL)
--
-- Running this file recreates the two tables from scratch.
-- Use it through: npm run db:setup
-- =====================================================================

-- Drop in reverse dependency order so the script can be re-run safely.
DROP TABLE IF EXISTS driver_locations;
DROP TABLE IF EXISTS rides;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(100) NOT NULL,           -- bcrypt hash, never plain text
  role        VARCHAR(20)  NOT NULL CHECK (role IN ('PASSENGER', 'DRIVER', 'ADMIN')),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- rides
-- ---------------------------------------------------------------------
CREATE TABLE rides (
  id              SERIAL PRIMARY KEY,
  passenger_id    INTEGER NOT NULL REFERENCES users(id),
  driver_id       INTEGER REFERENCES users(id),   -- NULL until a driver accepts
  origin          VARCHAR(200) NOT NULL,
  destination     VARCHAR(200) NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'REQUESTED'
                  CHECK (status IN ('REQUESTED', 'ACCEPTED', 'STARTED', 'COMPLETED', 'CANCELLED')),
  -- Map coordinates (NULL for rides requested without the map)
  origin_lat         DOUBLE PRECISION,
  origin_lng         DOUBLE PRECISION,
  destination_lat    DOUBLE PRECISION,
  destination_lng    DOUBLE PRECISION,
  -- Route estimates calculated by the routing/pricing services
  distance_km        DOUBLE PRECISION,
  estimated_duration INTEGER,   -- minutes
  estimated_price    INTEGER,   -- Toman
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  accepted_at     TIMESTAMP,
  started_at      TIMESTAMP,
  completed_at    TIMESTAMP,
  cancelled_at    TIMESTAMP
);

-- Indexes for the queries used by the application.
CREATE INDEX idx_rides_passenger ON rides(passenger_id);
CREATE INDEX idx_rides_driver    ON rides(driver_id);
CREATE INDEX idx_rides_status    ON rides(status);

-- ---------------------------------------------------------------------
-- driver_locations
-- Simulated locations of the demo drivers (no real GPS).
-- ---------------------------------------------------------------------
CREATE TABLE driver_locations (
  id        SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  area      VARCHAR(100) NOT NULL,
  lat       DOUBLE PRECISION NOT NULL,
  lng       DOUBLE PRECISION NOT NULL
);

