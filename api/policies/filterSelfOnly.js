/**
 * Filter Self Only Policy
 * Filters requested items to those matching the current user (for user API)
 */
module.exports = function (req, res, next) {

  // Reject if not logged in
  if (!req.user || !req.user.id) return res.forbidden('Forbidden');

  // Allow if user ID matches logged in user
  if (req.param('id') == req.user.id) return next();

  // Allow if parent ID for associated models matches logged in user
  if (req.param('parentid') == req.user.id) return next();

  // Redirect to current user if requested user list
  if (req.options.action === 'find') return res.redirect('./' + req.user.id);

  // Reject all other requests
  res.forbidden('Forbidden');

};
