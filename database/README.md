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

4. If the database already exists from the first project phase (before the
   map feature), upgrade it in place instead of recreating it:

   ```
   npm run db:migrate
   ```

   The files in `migrations/` add the new columns and the `driver_locations`
   table. They are idempotent and never delete data.

## Database structure

| Table            | Purpose                                             |
|------------------|-----------------------------------------------------|
| users            | Accounts (passenger / driver / admin)               |
| rides            | Ride requests, status workflow and route estimates  |
| driver_locations | Simulated map positions of the demo drivers         |

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

Then `npm run db:setup` (new) or `npm run db:migrate` (existing) as above.

## Demo accounts

All seed accounts use simple demo passwords:

| Role      | Email                  | Password     | Simulated location |
|-----------|------------------------|--------------|--------------------|
| Admin     | admin@taxi.local       | admin123     | -                  |
| Driver    | driver@taxi.local      | driver123    | Vanak              |
| Driver    | driver2@taxi.local     | driver123    | Tajrish            |
| Driver    | driver3@taxi.local     | driver123    | Azadi              |
| Driver    | driver4@taxi.local     | driver123    | Sadeghieh          |
| Passenger | passenger@taxi.local   | passenger123 | -                  |
