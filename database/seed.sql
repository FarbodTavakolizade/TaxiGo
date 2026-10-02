-- =====================================================================
-- Seed data for demonstration and testing.
--
-- Demo accounts (passwords are stored as bcrypt hashes):
--   Admin     : admin@taxi.local     / admin123
--   Driver    : driver@taxi.local    / driver123
--   Driver 2  : driver2@taxi.local   / driver123
--   Driver 3  : driver3@taxi.local   / driver123
--   Driver 4  : driver4@taxi.local   / driver123
--   Passenger : passenger@taxi.local / passenger123
-- =====================================================================

INSERT INTO users (name, email, password, role, is_active) VALUES
  ('System Admin', 'admin@taxi.local',
   '$2b$10$l7hlB4BaTVUdI0vod10fqOo.UVaFut5bZlB9NnuuoeAWMXazDS2Yi', 'ADMIN', TRUE),
  ('Reza Driver', 'driver@taxi.local',
   '$2b$10$/W1VTFC.E/kWswT7tE0hxOvi50mik7/wxtFDVGZ2Mv/8VIKSuYHri', 'DRIVER', TRUE),
  ('Sara Driver', 'driver2@taxi.local',
   '$2b$10$/W1VTFC.E/kWswT7tE0hxOvi50mik7/wxtFDVGZ2Mv/8VIKSuYHri', 'DRIVER', TRUE),
  ('Amir Driver', 'driver3@taxi.local',
   '$2b$10$/W1VTFC.E/kWswT7tE0hxOvi50mik7/wxtFDVGZ2Mv/8VIKSuYHri', 'DRIVER', TRUE),
  ('Neda Driver', 'driver4@taxi.local',
   '$2b$10$/W1VTFC.E/kWswT7tE0hxOvi50mik7/wxtFDVGZ2Mv/8VIKSuYHri', 'DRIVER', TRUE),
  ('Ali Passenger', 'passenger@taxi.local',
   '$2b$10$pWwaxrBLNMRp3rEL3IKMrewXhEyjOFfS94D7dsoUOa1Uy1n2fFyYq', 'PASSENGER', TRUE);

-- Simulated Tehran locations of the demo drivers (shown on the map).
INSERT INTO driver_locations (driver_id, area, lat, lng)
SELECT id, 'Vanak', 35.757500, 51.410000 FROM users WHERE email = 'driver@taxi.local';

INSERT INTO driver_locations (driver_id, area, lat, lng)
SELECT id, 'Tajrish', 35.804000, 51.434000 FROM users WHERE email = 'driver2@taxi.local';

INSERT INTO driver_locations (driver_id, area, lat, lng)
SELECT id, 'Azadi', 35.699700, 51.338000 FROM users WHERE email = 'driver3@taxi.local';

INSERT INTO driver_locations (driver_id, area, lat, lng)
SELECT id, 'Sadeghieh', 35.710000, 51.330000 FROM users WHERE email = 'driver4@taxi.local';

-- A few example rides in different states so every page has content.
-- Coordinates are real Tehran locations so the rides also appear on the map.
INSERT INTO rides (passenger_id, driver_id, origin, destination, status,
                   origin_lat, origin_lng, destination_lat, destination_lng,
                   distance_km, estimated_duration, estimated_price,
                   accepted_at, started_at, completed_at)
SELECT p.id, d.id, 'Azadi Square', 'Mehrabad Airport', 'COMPLETED',
       35.699700, 51.338000, 35.689200, 51.313400,
       2.5, 5, 75000,
       NOW() - INTERVAL '2 hours', NOW() - INTERVAL '110 minutes', NOW() - INTERVAL '80 minutes'
FROM users p, users d
WHERE p.email = 'passenger@taxi.local' AND d.email = 'driver@taxi.local';

INSERT INTO rides (passenger_id, driver_id, origin, destination, status,
                   origin_lat, origin_lng, destination_lat, destination_lng,
                   distance_km, estimated_duration, estimated_price,
                   accepted_at, started_at)
SELECT p.id, d.id, 'Valiasr Street', 'Tajrish Square', 'STARTED',
       35.744000, 51.410000, 35.804000, 51.434000,
       7.1, 14, 121000,
       NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '10 minutes'
FROM users p, users d
WHERE p.email = 'passenger@taxi.local' AND d.email = 'driver2@taxi.local';

INSERT INTO rides (passenger_id, origin, destination, status,
                   origin_lat, origin_lng, destination_lat, destination_lng,
                   distance_km, estimated_duration, estimated_price)
SELECT id, 'Enghelab Street', 'Azadi Square', 'REQUESTED',
       35.701000, 51.390000, 35.699700, 51.338000,
       4.7, 9, 97000
FROM users
WHERE email = 'passenger@taxi.local';
