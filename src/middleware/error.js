const AppError = require('../errors');

/** Renders the friendly 404 page for unknown URLs. */
function notFoundHandler(req, res, next) {
  next(new AppError(404, 'The page you are looking for does not exist.'));
}

/**
 * Central error handler.
 * - AppError: expected problem, safe message is shown to the user.
 * - Other errors: unexpected problem, details are logged but NOT shown.
 *
 * /api/ paths always receive JSON. Normal pages redirect back with a flash
 * message for POST requests and render an error page for GET requests.
 */
function errorHandler(err, req, res, next) {
  const status = err instanceof AppError ? err.statusCode : 500;

  if (status >= 500) {
    console.error(err);
  }

  const message =
    status >= 500 ? 'Something went wrong. Please try again.' : err.message;

  // JSON API: the map code reads errors from the response body.
  if (req.path.startsWith('/api/')) {
    return res.status(status).json({ error: message });
  }

  if (req.method === 'POST') {
    req.flash('error', message);

    // Go back to the referring page when possible, otherwise to the
    // home page for the user's role.
    const fallback = req.session.user
      ? dashboardUrlFor(req.session.user.role)
      : '/login';
    return res.redirect(req.get('Referrer') || fallback);
  }

  return res.status(status).render('errors/error', {
    title: `Error ${status}`,
    status,
    message,
  });
}

function dashboardUrlFor(role) {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'DRIVER') return '/driver/dashboard';
  return '/passenger/dashboard';
}

module.exports = { notFoundHandler, errorHandler };
