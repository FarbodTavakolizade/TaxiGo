const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../constants');

const router = express.Router();

// Everything below is only for logged-in administrators.
// The middleware is scoped to the /admin path, otherwise it would also
// run for requests that simply pass through this router (Express runs
// router.use middleware for every request that reaches the router).
router.use('/admin', requireAuth, requireRole(ROLES.ADMIN));

router.get('/admin/dashboard', adminController.dashboard);
router.get('/admin/users', adminController.showUsers);
router.post('/admin/users/:id/active', adminController.setUserActive);
router.get('/admin/rides', adminController.showRides);

module.exports = router;
