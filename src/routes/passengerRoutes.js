const express = require('express');
const passengerController = require('../controllers/passengerController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../constants');

const router = express.Router();

// Everything below is only for logged-in passengers.
router.use(requireAuth, requireRole(ROLES.PASSENGER));

router.get('/passenger/dashboard', passengerController.dashboard);
router.get('/passenger/rides', passengerController.showRides);
router.get('/passenger/rides/new', passengerController.showNewRideForm);
router.post('/passenger/rides', passengerController.createRide);
router.post('/passenger/rides/:id/cancel', passengerController.cancelRide);

module.exports = router;
