/**
 * Filter Self Only Policy
 * Filters requested items to those matching the current user (for user API)
 */
module.exports = function (req, res, next) {
  if (!req.user || (req.param('id') && req.param('id') != req.user.id)) {
    return res.forbidden('You are not permitted to perform this action.');
  }
  req.query.id = req.user.id;
  next();
};
