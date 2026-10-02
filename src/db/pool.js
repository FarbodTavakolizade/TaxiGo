// Single shared PostgreSQL connection pool for the whole application.
const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
});

pool.on('error', (err) => {
  // Errors on idle clients are logged; the pool recovers automatically.
  console.error('Unexpected database error on idle client:', err.message);
});

module.exports = pool;
