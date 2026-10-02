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

  let result;
  try {
    result = await rideService.requestRide(req.session.user, req.body);
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

  if (result.assignment) {
    req.flash(
      'success',
      `Taxi requested. ${result.assignment.driver.name} is on the way ` +
      `(${result.assignment.driver.area}, ${result.assignment.distanceKm} km away).`
    );
  } else if (result.ride.status === 'REQUESTED') {
    req.flash('success', 'Your taxi request has been created.');
  } else {
    req.flash('success', 'Your taxi request has been created. Waiting for a driver.');
  }

  res.redirect(`/passenger/rides/${result.ride.id}`);
}

/** Ride details page with the map (origin, destination, driver). */
async function showRideDetails(req, res) {
  const { ride, driverLocation } = await rideService.getRideDetails(
    req.session.user,
    req.params.id
  );

  res.render('passenger/ride-details', {
    title: `Ride #${ride.id}`,
    ride,
    driverLocation,
  });
}

async function cancelRide(req, res) {
  await rideService.cancelByPassenger(req.session.user, req.params.id);
  req.flash('success', 'Ride cancelled.');
  res.redirect('/passenger/rides');
}

module.exports = {
  dashboard,
  showRides,
  showNewRideForm,
  createRide,
  showRideDetails,
  cancelRide,
};
