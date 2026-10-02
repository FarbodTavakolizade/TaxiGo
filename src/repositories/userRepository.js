// Database access for the users table.
// All queries are parameterized ($1, $2, ...) - never built by string
// concatenation.
const pool = require('../db/pool');

/**
 * Finds a user by email. Returns the row including the password hash,
 * so the caller must never send this object directly to a view.
 */
async function findByEmail(email) {
  const result = await pool.query(
    `SELECT id, name, email, password, role, is_active, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query(
    `SELECT id, name, email, password, role, is_active, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/** Inserts a new user and returns the created row (without password). */
async function createUser({ name, email, passwordHash, role }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_active, created_at`,
    [name, email, passwordHash, role]
  );
  return result.rows[0];
}

module.exports = { findByEmail, findById, createUser };
