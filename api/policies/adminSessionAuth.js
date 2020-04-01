const GitHub = require('../services/GitHub');
const utils = require('../utils');

module.exports = async function adminSessionAuth(req, res, next) {
  req.session.authRedirectPath = undefined;
  if (req.session.authenticated) {
    const lastAuthenticatedAt = req.session.authenticatedAt;
    if (!lastAuthenticatedAt || utils.isPastAuthThreshold(lastAuthenticatedAt)) {
      // check that the authenticated user is still an admin member
      try {
        await GitHub.validateAdmin(req.user.githubAccessToken);
      } catch (error) {
        req.logout();
        req.session.destroy();
        return res.forbidden({
          message: 'You are not permitted to perform this action.',
        });
      }

      req.session.authenticatedAt = new Date();
      return next();
    }
    // else
    return next();
  }
  // else
  return res.forbidden({
    message: 'You are not permitted to perform this action. Are you sure you are logged in?',
  });
};
