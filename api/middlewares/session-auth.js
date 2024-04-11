const utils = require('../utils');
const config = require('../../config');
const EventCreator = require('../services/EventCreator');
const { Event } = require('../models');

module.exports = function sessionAuth(req, res, next) {
  req.session.authRedirectPath = undefined;
  if (req.session.authenticated) {
    const lastAuthenticatedAt = req.session.authenticatedAt;
    if (!lastAuthenticatedAt || utils.isPastAuthThreshold(lastAuthenticatedAt)) {
      req.logout((logoutError) => {
        if (logoutError) {
          EventCreator.error(Event.labels.AUTHENTICATION, logoutError, { user: req.user });
        }

        return res.redirect(config.app.hostname);
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
