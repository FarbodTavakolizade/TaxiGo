// Authentication rules: registration and login.
const bcrypt = require('bcrypt');
const AppError = require('../errors');
const { ROLES } = require('../constants');
const userRepository = require('../repositories/userRepository');
const {
  validateName,
  validateEmail,
  validatePassword,
  validateRequired,
  firstError,
} = require('../utils/validators');

const BCRYPT_ROUNDS = 10;

/** Roles a visitor may choose when registering (never ADMIN). */
const SELF_REGISTER_ROLES = [ROLES.PASSENGER, ROLES.DRIVER];

/**
 * Registers a new passenger or driver.
 * Returns the created user (without password).
 */
async function register({ name, email, password, role }) {
  const error = firstError(
    validateName(name),
    validateEmail(email),
    validatePassword(password),
    SELF_REGISTER_ROLES.includes(role) ? null : 'Please choose a valid role.'
  );
  if (error) throw new AppError(400, error);

  const cleanEmail = email.trim().toLowerCase();
  const existing = await userRepository.findByEmail(cleanEmail);
  if (existing) {
    throw new AppError(400, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return userRepository.createUser({
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    role,
  });
}

/**
 * Checks email and password and returns the matching active user
 * (without password). Throws AppError when login is not possible.
 */
async function login({ email, password }) {
  // On login only presence is required; the credential check itself
  // produces the (deliberately vague) error message.
  const error = firstError(
    validateEmail(email),
    validateRequired(password, 'Password')
  );
  if (error) throw new AppError(400, error);

  const user = await userRepository.findByEmail(email.trim().toLowerCase());

  // The same message is used for unknown email and wrong password so the
  // form does not reveal which emails exist.
  const invalidMessage = 'Email or password is incorrect.';
  if (!user) throw new AppError(401, invalidMessage);

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) throw new AppError(401, invalidMessage);

  if (!user.is_active) {
    throw new AppError(403, 'This account has been deactivated. Please contact the administrator.');
  }

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

module.exports = { register, login };
