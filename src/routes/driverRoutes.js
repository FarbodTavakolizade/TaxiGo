const express = require('express');
const driverController = require('../controllers/driverController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../constants');

const router = express.Router();

// Everything below is only for logged-in drivers.
// The middleware is scoped to the /driver path, otherwise it would also
// run for requests that simply pass through this router (Express runs
// router.use middleware for every request that reaches the router).
router.use('/driver', requireAuth, requireRole(ROLES.DRIVER));

router.get('/driver/dashboard', driverController.dashboard);
router.get('/driver/rides', driverController.showRides);

router.post('/driver/rides/:id/accept', driverController.acceptRide);
router.post('/driver/rides/:id/start', driverController.startRide);
router.post('/driver/rides/:id/complete', driverController.completeRide);
router.post('/driver/rides/:id/cancel', driverController.cancelRide);

module.exports = router;
