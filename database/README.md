# Database setup

The project uses PostgreSQL. Two options are supported:

## Option A - existing PostgreSQL installation

1. Create the database:

   ```
   createdb -U postgres taxi_system
   ```

2. Put your credentials in `.env` (copy `.env.example` first).

3. Run the setup script (creates tables and seed data):

   ```
   npm run db:setup
   ```

## Option B - project-local PostgreSQL instance (used on this machine)

On this machine the global PostgreSQL service password was unknown, so the
project uses its own database cluster **outside the project folder** so it is
never included in the submission:

- Data directory: `C:\Users\Asus\taxi_pgdata`
- Port: `5544` (port 5433 is reserved by Windows/Hyper-V on this machine)

Start / stop commands (PostgreSQL 18 binaries):

```
# start
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D C:\Users\Asus\taxi_pgdata -o "-p 5544" -l C:\Users\Asus\taxi_pgdata\pg.log start

# stop
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D C:\Users\Asus\taxi_pgdata stop
```

Then `npm run db:setup` as above.

## Demo accounts

All seed accounts use simple demo passwords:

| Role      | Email                  | Password     |
|-----------|------------------------|--------------|
| Admin     | admin@taxi.local       | admin123     |
| Driver    | driver@taxi.local      | driver123    |
| Driver    | driver2@taxi.local     | driver123    |
| Passenger | passenger@taxi.local   | passenger123 |
