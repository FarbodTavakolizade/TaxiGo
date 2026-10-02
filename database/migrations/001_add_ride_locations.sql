-- =====================================================================
-- Migration 001: ride coordinates, distance, duration and price,
-- plus simulated driver locations for the map.
--
-- Safe to run on an existing database: it only adds columns and a table,
-- and every statement is idempotent. No existing data is changed.
--
-- Run with: npm run db:migrate
-- =====================================================================

-- 1. New ride columns. Old rides keep NULL in these columns.
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS origin_lat         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS origin_lng         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS destination_lat    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS destination_lng    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS distance_km        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,   -- minutes
  ADD COLUMN IF NOT EXISTS estimated_price    INTEGER;   -- Toman

-- 2. Simulated driver locations (one row per driver).
CREATE TABLE IF NOT EXISTS driver_locations (
  id        SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  area      VARCHAR(100) NOT NULL,
  lat       DOUBLE PRECISION NOT NULL,
  lng       DOUBLE PRECISION NOT NULL
);

-- 3. Two extra demo drivers, inserted only when missing.
--    Password hash is the same "driver123" used by the seed data.
INSERT INTO users (name, email, password, role)
SELECT 'Amir Driver', 'driver3@taxi.local',
       '$2b$10$/W1VTFC.E/kWswT7tE0hxOvi50mik7/wxtFDVGZ2Mv/8VIKSuYHri', 'DRIVER'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver3@taxi.local');

INSERT INTO users (name, email, password, role)
SELECT 'Neda Driver', 'driver4@taxi.local',
       '$2b$10$/W1VTFC.E/kWswT7tE0hxOvi50mik7/wxtFDVGZ2Mv/8VIKSuYHri', 'DRIVER'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver4@taxi.local');

-- 4. Simulated Tehran locations for the four demo drivers.
INSERT INTO driver_locations (driver_id, area, lat, lng)
SELECT id, 'Vanak', 35.757500, 51.410000 FROM users WHERE email = 'driver@taxi.local'
ON CONFLICT (driver_id) DO NOTHING;

INSERT INTO driver_locations (driver_id, area, lat, lng)
SELECT id, 'Tajrish', 35.804000, 51.434000 FROM users WHERE email = 'driver2@taxi.local'
ON CONFLICT (driver_id) DO NOTHING;

INSERT INTO driver_locations (driver_id, area, lat, lng)
SELECT id, 'Azadi', 35.699700, 51.338000 FROM users WHERE email = 'driver3@taxi.local'
ON CONFLICT (driver_id) DO NOTHING;

INSERT INTO driver_locations (driver_id, area, lat, lng)
SELECT id, 'Sadeghieh', 35.710000, 51.330000 FROM users WHERE email = 'driver4@taxi.local'
ON CONFLICT (driver_id) DO NOTHING;
