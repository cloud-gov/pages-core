const GitHub = require('../services/GitHub');
const utils = require('../utils');

module.exports = async function adminSessionAuth(req, res, next) {
  req.session.authRedirectPath = undefined;

  // Commenting out to test sessionless token auth
  if (!req.session.adminAuthenticated) {
    return res.forbidden({
      message: 'You are not permitted to perform this action. Are you sure you are logged in?',
    });
  }

  // Grab token header for sessionless testing
  // const token = req.header('token');

  const lastAuthenticatedAt = req.session.adminAuthenticatedAt;
  if (!lastAuthenticatedAt || utils.isPastAuthThreshold(lastAuthenticatedAt)) {
    // check that the adminAuthenticated user is still an admin member
    try {
      await GitHub.validateAdmin(req.user.githubAccessToken);
      req.session.adminAuthenticatedAt = new Date();
      return next();
    } catch (error) {
      req.logout();
      req.session.destroy();
      return res.forbidden({
        message: 'You are not permitted to perform this action.',
      });
    }
  }

  return next();
};
