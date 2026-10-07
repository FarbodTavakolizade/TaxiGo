const path = require('path');
const express = require('express');
const session = require('express-session');

const config = require('./config');
const pool = require('./db/pool');
const { notFoundHandler, errorHandler } = require('./middleware/error');
const { formatDateTime } = require('./utils/format');

const app = express();

// ----- View engine -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// ----- Global middleware -----
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // JSON bodies for the map API

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// Makes flash messages and the logged-in user available in every view.
app.use((req, res, next) => {
  req.flash = (type, message) => {
    req.session.flash = req.session.flash || {};
    req.session.flash[type] = message;
  };

  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || {};
  delete req.session.flash;

  res.locals.currentPath = req.path;
  res.locals.helpers = { formatDateTime };
  next();
});

// ----- Routes -----
const authRoutes = require('./routes/authRoutes');
const passengerRoutes = require('./routes/passengerRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiRoutes = require('./routes/apiRoutes');

// Public entry point. Guests see the landing page; a logged-in user keeps
// the existing behaviour and is sent to the dashboard for their role.
app.get('/', (req, res) => {
  const user = req.session.user;
  if (!user) return res.render('landing', { title: 'Welcome' });
  if (user.role === 'ADMIN') return res.redirect('/admin/dashboard');
  if (user.role === 'DRIVER') return res.redirect('/driver/dashboard');
  return res.redirect('/passenger/dashboard');
});

app.use(authRoutes);
app.use(passengerRoutes);
app.use(driverRoutes);
app.use(adminRoutes);
app.use(apiRoutes);

// Simple health check that also verifies the database connection.
app.get('/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'ok' });
});

// ----- Error handling (must be registered last) -----
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
