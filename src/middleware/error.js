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
 * On POST requests the user is redirected back to the previous page with
 * an error message (flash). On GET requests an error page is rendered.
 */
function errorHandler(err, req, res, next) {
  const status = err instanceof AppError ? err.statusCode : 500;

  if (status >= 500) {
    console.error(err);
  }

  const message =
    status >= 500 ? 'Something went wrong. Please try again.' : err.message;

  if (req.method === 'POST') {
    req.flash('error', message);
    return res.redirect(req.get('Referrer') || '/');
  }

  return res.status(status).render('errors/error', {
    title: `Error ${status}`,
    status,
    message,
  });
}

module.exports = { notFoundHandler, errorHandler };
