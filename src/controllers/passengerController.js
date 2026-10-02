const rideService = require('../services/rideService');

async function dashboard(req, res) {
  const data = await rideService.getPassengerDashboard(req.session.user.id);
  res.render('passenger/dashboard', {
    title: 'Passenger Dashboard',
    currentRides: data.currentRides,
    completedRides: data.completedRides,
    recentRides: data.recentRides,
  });
}

async function showRides(req, res) {
  const rides = await rideService.getPassengerRides(req.session.user.id);
  res.render('passenger/rides', { title: 'My Rides', rides });
}

function showNewRideForm(req, res) {
  res.render('passenger/new-ride', { title: 'Request Taxi', form: {} });
}

async function createRide(req, res) {
  const { origin, destination } = req.body;

  try {
    await rideService.requestRide(req.session.user, { origin, destination });
  } catch (err) {
    // Keep what was typed so the form can be shown again.
    if (err.name === 'AppError') {
      return res.status(err.statusCode).render('passenger/new-ride', {
        title: 'Request Taxi',
        form: { origin, destination },
        error: err.message,
      });
    }
    throw err;
  }

  req.flash('success', 'Your taxi request has been created.');
  res.redirect('/passenger/rides');
}

async function cancelRide(req, res) {
  await rideService.cancelByPassenger(req.session.user, req.params.id);
  req.flash('success', 'Ride cancelled.');
  res.redirect('/passenger/rides');
}

module.exports = { dashboard, showRides, showNewRideForm, createRide, cancelRide };
