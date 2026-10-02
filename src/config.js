// Loads configuration from the .env file (see .env.example).
require('dotenv').config({ quiet: true });

module.exports = {
  port: Number(process.env.PORT) || 3000,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'taxi_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },

  sessionSecret: process.env.SESSION_SECRET || 'change_me',

  // ------------------------------------------------------------------
  // Taxi pricing (single place, no duplication elsewhere in the code).
  // Amounts are in Toman.
  // ------------------------------------------------------------------
  pricing: {
    BASE_FARE: 50000,        // fixed starting amount
    PRICE_PER_KM: 10000,     // cost of each kilometer
    ROUND_TO: 1000,          // round the final price to this step
  },

  // ------------------------------------------------------------------
  // Route estimation.
  // ------------------------------------------------------------------
  routing: {
    AVERAGE_SPEED_KMH: 30,     // simple average city speed, no traffic data
    MAX_SNAP_DISTANCE_KM: 20,  // larger than this -> use straight-line fallback
  },
};
