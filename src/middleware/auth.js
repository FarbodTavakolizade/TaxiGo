/**
 * Access control middleware.
 *
 * requireAuth  - only logged-in, active users may continue. The user row is
 *                reloaded from the database on every request, so deactivating
 *                an account (or changing its role) takes effect immediately.
 * requireRole  - only the given roles may continue.
 * requireGuest - only visitors who are NOT logged in (login/register pages).
 */
const AppError = require('../errors');
const userRepository = require('../repositories/userRepository');

async function requireAuth(req, res, next) {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
  }

  const user = await userRepository.findById(sessionUser.id);
  if (!user || !user.is_active) {
    return req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  }

  // Keep the session copy fresh (role could have been changed by an admin).
  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user || !roles.includes(user.role)) {
      return next(new AppError(403, 'You do not have permission to view this page.'));
    }
    return next();
  };
}

function requireGuest(req, res, next) {
  const user = req.session.user;
  if (!user) return next();

  if (user.role === 'ADMIN') return res.redirect('/admin/dashboard');
  if (user.role === 'DRIVER') return res.redirect('/driver/dashboard');
  return res.redirect('/passenger/dashboard');
}

module.exports = { requireAuth, requireRole, requireGuest };
