/**
 * Application error with an HTTP status code.
 * Services throw AppError for expected problems (validation, permissions,
 * invalid state). The central error handler turns it into a friendly
 * response. Anything that is NOT an AppError is treated as an unexpected
 * server error and its details are hidden from the user.
 */
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
