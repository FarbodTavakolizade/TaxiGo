const adminService = require('../services/adminService');

async function dashboard(req, res) {
  const stats = await adminService.getDashboardStats();
  res.render('admin/dashboard', { title: 'Admin Dashboard', stats });
}

async function showUsers(req, res) {
  const users = await adminService.getUsers();
  res.render('admin/users', { title: 'Users', users });
}

async function setUserActive(req, res) {
  // The form sends "active=1" to activate and "active=0" to deactivate.
  const isActive = req.body.active === '1';
  await adminService.setUserActive(req.session.user, req.params.id, isActive);
  req.flash('success', isActive ? 'User activated.' : 'User deactivated.');
  res.redirect('/admin/users');
}

async function showRides(req, res) {
  const rides = await adminService.getAllRides();
  res.render('admin/rides', { title: 'All Rides', rides });
}

module.exports = { dashboard, showUsers, setUserActive, showRides };
