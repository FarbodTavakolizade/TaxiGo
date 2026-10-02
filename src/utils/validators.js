/**
 * Small server-side validation helpers.
 * Each validator returns an error message, or null when the value is fine.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 6;

function validateName(name) {
  if (!name || !name.trim()) return 'Name is required.';
  if (name.trim().length > 100) return 'Name must be at most 100 characters.';
  return null;
}

function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Email format is not valid.';
  return null;
}

function validatePassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

function validateRequired(value, fieldName) {
  if (!value || !value.trim()) return `${fieldName} is required.`;
  return null;
}

function validateMaxLength(value, fieldName, max) {
  if (value && value.trim().length > max) {
    return `${fieldName} must be at most ${max} characters.`;
  }
  return null;
}

/** Collects the first error found, or null when everything is valid. */
function firstError(...errors) {
  return errors.find((error) => error !== null) || null;
}

module.exports = {
  validateName,
  validateEmail,
  validatePassword,
  validateRequired,
  validateMaxLength,
  firstError,
  MIN_PASSWORD_LENGTH,
};
