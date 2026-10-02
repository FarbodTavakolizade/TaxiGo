const express = require('express');
const apiController = require('../controllers/apiController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All API endpoints require a logged-in user.
router.use('/api', requireAuth);

router.post('/api/route', apiController.calculateRoute);
router.get('/api/drivers', apiController.listDrivers);
router.get('/api/graph', apiController.listGraphNodes);
router.get('/api/rides/:id', apiController.getRide);

module.exports = router;
