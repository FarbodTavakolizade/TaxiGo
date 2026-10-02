-- =====================================================================
-- Seed data for demonstration and testing.
--
-- Demo accounts (passwords are stored as bcrypt hashes):
--   Admin     : admin@taxi.local     / admin123
--   Driver    : driver@taxi.local    / driver123
--   Driver 2  : driver2@taxi.local   / driver123
--   Passenger : passenger@taxi.local / passenger123
-- =====================================================================

INSERT INTO users (name, email, password, role, is_active) VALUES
  ('System Admin', 'admin@taxi.local',
   '$2b$10$l7hlB4BaTVUdI0vod10fqOo.UVaFut5bZlB9NnuuoeAWMXazDS2Yi', 'ADMIN', TRUE),
  ('Reza Driver', 'driver@taxi.local',
   '$2b$10$/W1VTFC.E/kWswT7tE0hxOvi50mik7/wxtFDVGZ2Mv/8VIKSuYHri', 'DRIVER', TRUE),
  ('Sara Driver', 'driver2@taxi.local',
   '$2b$10$/W1VTFC.E/kWswT7tE0hxOvi50mik7/wxtFDVGZ2Mv/8VIKSuYHri', 'DRIVER', TRUE),
  ('Ali Passenger', 'passenger@taxi.local',
   '$2b$10$pWwaxrBLNMRp3rEL3IKMrewXhEyjOFfS94D7dsoUOa1Uy1n2fFyYq', 'PASSENGER', TRUE);

-- A few example rides in different states so every page has content.
INSERT INTO rides (passenger_id, driver_id, origin, destination, status,
                   accepted_at, started_at, completed_at)
SELECT p.id, d.id, 'Azadi Square', 'Mehrabad Airport', 'COMPLETED',
       NOW() - INTERVAL '2 hours', NOW() - INTERVAL '110 minutes', NOW() - INTERVAL '80 minutes'
FROM users p, users d
WHERE p.email = 'passenger@taxi.local' AND d.email = 'driver@taxi.local';

INSERT INTO rides (passenger_id, driver_id, origin, destination, status,
                   accepted_at, started_at)
SELECT p.id, d.id, 'Valiasr Street', 'Tajrish Square', 'STARTED',
       NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '10 minutes'
FROM users p, users d
WHERE p.email = 'passenger@taxi.local' AND d.email = 'driver2@taxi.local';

INSERT INTO rides (passenger_id, origin, destination, status)
SELECT id, 'Enghelab Street', 'Azadi Square', 'REQUESTED'
FROM users
WHERE email = 'passenger@taxi.local';
