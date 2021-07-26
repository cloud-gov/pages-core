const ensureAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.unauthorized();
  }
  return next();
};

module.exports = ensureAuthenticated;
