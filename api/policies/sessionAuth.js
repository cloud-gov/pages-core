const GitHub = require('../services/GitHub');
const utils = require('../utils');

module.exports = function sessionAuth(req, res, next) {
  req.session.authRedirectPath = undefined;
  if (req.session.authenticated) {
    const lastAuthenticatedAt = req.session.authenticatedAt;
    if (!lastAuthenticatedAt || utils.isPastAuthThreshold(lastAuthenticatedAt)) {
      // check that the authenticated user is still a member of a valid GitHub org
      return GitHub.validateUser(req.user.githubAccessToken)
        .then(() => {
          // reset authenticatedAt to the current time
          req.session.authenticatedAt = new Date();
          return next();
        })
        .catch(() => {
          // log the user out and destroy their session
          req.logout();
          req.session.destroy();
          return res.forbidden({
            message: 'You are not permitted to perform this action.',
          });
        });
    }
    // else
    return next();
  }
  // else
  return res.forbidden({
    message: 'You are not permitted to perform this action. Are you sure you are logged in?',
  });
};
