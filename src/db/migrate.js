/**
 * Applies all SQL files in database/migrations, in filename order.
 * Run with: npm run db:migrate
 *
 * Every migration file is written to be idempotent (IF NOT EXISTS,
 * ON CONFLICT DO NOTHING), so running this repeatedly is safe and no
 * existing data is ever deleted.
 */
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function main() {
  const migrationsDir = path.join(__dirname, '..', '..', 'database', 'migrations');

  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running migration ${file} ...`);
    await pool.query(sql);
  }

  console.log(`Applied ${files.length} migration file(s). Existing data was kept.`);
}

main()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
