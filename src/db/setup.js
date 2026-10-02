/**
 * Creates the database tables and inserts the seed data.
 * Run with: npm run db:setup
 *
 * This simply executes database/schema.sql and database/seed.sql,
 * so the SQL files remain the single source of truth.
 */
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function runSqlFile(filename) {
  const filePath = path.join(__dirname, '..', '..', 'database', filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Running ${filename} ...`);
  await pool.query(sql);
}

async function main() {
  try {
    await runSqlFile('schema.sql');
    await runSqlFile('seed.sql');
    console.log('Database setup complete.');
    console.log('Demo accounts:');
    console.log('  admin@taxi.local / admin123');
    console.log('  driver@taxi.local / driver123');
    console.log('  driver2@taxi.local / driver123');
    console.log('  passenger@taxi.local / passenger123');
  } catch (err) {
    console.error('Database setup failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
