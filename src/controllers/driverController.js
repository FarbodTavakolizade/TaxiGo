const rideService = require('../services/rideService');
const driverService = require('../services/driverService');

async function dashboard(req, res) {
  const data = await rideService.getDriverDashboard(req.session.user.id);
  const location = await driverService.getDriverLocation(req.session.user.id);

  res.render('driver/dashboard', {
    title: 'Driver Dashboard',
    availableRides: data.availableRides,
    activeRide: data.activeRide,
    completedRides: data.completedRides,
    myLocation: location,
  });
}

/** Ride details page for the assigned driver (map with route). */
async function showRideDetails(req, res) {
  const { ride, driverLocation } = await rideService.getRideDetails(
    req.session.user,
    req.params.id
  );

  res.render('driver/ride-details', {
    title: `Ride #${ride.id}`,
    ride,
    driverLocation,
  });
}

async function showRides(req, res) {
  const rides = await rideService.getDriverRides(req.session.user.id);
  res.render('driver/rides', { title: 'My Rides', rides });
}

async function acceptRide(req, res) {
  await rideService.acceptRide(req.session.user, req.params.id);
  req.flash('success', 'Ride accepted. You can start it when you pick up the passenger.');
  res.redirect('/driver/dashboard');
}

async function startRide(req, res) {
  await rideService.startRide(req.session.user, req.params.id);
  req.flash('success', 'Ride started.');
  res.redirect('/driver/dashboard');
}

async function completeRide(req, res) {
  await rideService.completeRide(req.session.user, req.params.id);
  req.flash('success', 'Ride completed. Good job!');
  res.redirect('/driver/dashboard');
}

async function cancelRide(req, res) {
  await rideService.cancelByDriver(req.session.user, req.params.id);
  req.flash('success', 'Ride cancelled.');
  res.redirect('/driver/dashboard');
}

module.exports = {
  dashboard,
  showRides,
  showRideDetails,
  acceptRide,
  startRide,
  completeRide,
  cancelRide,
};
