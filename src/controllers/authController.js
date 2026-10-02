const authService = require('../services/authService');

/** Sends each logged-in user to the dashboard that matches their role. */
function dashboardUrlFor(role) {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'DRIVER') return '/driver/dashboard';
  return '/passenger/dashboard';
}

function showLoginPage(req, res) {
  res.render('auth/login', { title: 'Login', form: {} });
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await authService.login({ email, password });
    req.session.user = user;
    req.flash('success', `Welcome back, ${user.name}!`);
    return res.redirect(dashboardUrlFor(user.role));
  } catch (err) {
    // Show the message directly above the login form.
    if (err.name === 'AppError') {
      return res.status(err.statusCode).render('auth/login', {
        title: 'Login',
        form: { email },
        error: err.message,
      });
    }
    throw err;
  }
}

function showRegisterPage(req, res) {
  res.render('auth/register', { title: 'Register', form: {} });
}

async function register(req, res) {
  const { name, email, password, role } = req.body;

  try {
    await authService.register({ name, email, password, role });
  } catch (err) {
    // Keep what the visitor typed so the form can be redisplayed.
    if (err.name === 'AppError') {
      return res.status(err.statusCode).render('auth/register', {
        title: 'Register',
        form: { name, email, role },
        error: err.message,
      });
    }
    throw err;
  }

  req.flash('success', 'Account created. You can log in now.');
  res.redirect('/login');
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

module.exports = { showLoginPage, login, showRegisterPage, register, logout };
