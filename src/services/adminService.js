/**
 * Admin rules: system statistics, user list and user activation.
 */
const AppError = require('../errors');
const { ROLES } = require('../constants');
const userRepository = require('../repositories/userRepository');
const rideRepository = require('../repositories/rideRepository');

/** Dashboard statistics (users and rides combined). */
async function getDashboardStats() {
  const [userStats, rideStats] = await Promise.all([
    userRepository.getStats(),
    rideRepository.getStats(),
  ]);
  return { ...userStats, ...rideStats };
}

async function getUsers() {
  return userRepository.findAll();
}

async function getAllRides() {
  return rideRepository.findAll();
}

/**
 * Activates or deactivates a user account.
 * An admin cannot deactivate their own account (that would lock the
 * admin out of the system during a demo).
 */
async function setUserActive(actingAdmin, userId, isActive) {
  if (actingAdmin.role !== ROLES.ADMIN) {
    throw new AppError(403, 'Only an administrator can do this.');
  }

  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(404, 'User not found.');
  }

  if (id === actingAdmin.id && !isActive) {
    throw new AppError(400, 'You cannot deactivate your own account.');
  }

  const user = await userRepository.setActive(id, isActive);
  if (!user) throw new AppError(404, 'User not found.');
  return user;
}

module.exports = { getDashboardStats, getUsers, getAllRides, setUserActive };
