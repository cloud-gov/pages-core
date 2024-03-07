const config = require('../../config');
const SiteWideErrorLoader = require('../services/SiteWideErrorLoader');
const { defaultContext } = require('../utils');

module.exports = {
  home(req, res) {
    // redirect to main app if is authenticated
    if (req.session.authenticated) {
      return res.redirect('/sites');
    }

    const context = defaultContext(req, res);

    return res.render('home.njk', context);
  },

  systemUse(req, res) {
    const context = defaultContext(req, res);

    return res.render('system-use.njk', context);
  },

  app(req, res) {
    if (!req.session.authenticated) {
      req.flash('error', 'You are not permitted to perform this action. Are you sure you are logged in?');
      return res.redirect('/');
    }

    const context = defaultContext(req, res);
    const hasUAAIdentity = !!req.user.UAAIdentity;

    context.isAuthenticated = true;
    context.username = req.user.username;
    context.siteWideError = SiteWideErrorLoader.loadSiteWideError();
    context.csrfToken = req.csrfToken();
    context.hasUAAIdentity = !!hasUAAIdentity;

    const frontendConfig = {
      TEMPLATES: config.templates,
    };

    context.frontendConfig = frontendConfig;

    return res.render('app.njk', context);
  },

  robots(req, res) {
    const DENY_ALL_CONTENT = 'User-Agent: *\nDisallow: /\n';

    res.set('Content-Type', 'text/plain');

    // send the "deny all" robots.txt content
    return res.send(DENY_ALL_CONTENT);
  },
};
