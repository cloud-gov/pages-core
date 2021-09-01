const { adminHostname } = require('../../config').app;

const ensureAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    if (req.hostname !== adminHostname) {
      return res.unauthorized({ message: 'Unauthorized. If you require access to Federalist, please click <a href="https://federalist.18f.gov/documentation/access-permissions/#personal-access">here</a> to view our documentation.'})
    }
    return res.unauthorized();
  }
  return next();
};

module.exports = ensureAuthenticated;
