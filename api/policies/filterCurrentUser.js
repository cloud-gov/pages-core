/**
 * Filter Current User Policy
 * Filters requested items to those matching the current user
 */
module.exports = function (req, res, next) {
  if (!req.user) {
    return res.forbidden('You are not permitted to perform this action.');
  }
  req.query.user = req.user.id;
  next();
};
