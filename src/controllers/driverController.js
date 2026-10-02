const rideService = require('../services/rideService');

async function dashboard(req, res) {
  const data = await rideService.getDriverDashboard(req.session.user.id);
  res.render('driver/dashboard', {
    title: 'Driver Dashboard',
    availableRides: data.availableRides,
    activeRide: data.activeRide,
    completedRides: data.completedRides,
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

module.exports = { dashboard, showRides, acceptRide, startRide, completeRide, cancelRide };
