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
};
