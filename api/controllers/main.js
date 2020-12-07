const config = require('../../config');
const SiteWideErrorLoader = require('../services/SiteWideErrorLoader');
const { loadAssetManifest, getSiteDisplayEnv, shouldIncludeTracking } = require('../utils');
const jwtHelper = require('../services/jwtHelper');

const webpackAssets = loadAssetManifest();

function defaultContext(req) {
  const messages = {
    errors: req.flash('error'),
  };

  const context = {
    isAuthenticated: false,
    messages,
    shouldIncludeTracking: shouldIncludeTracking(),
    siteDisplayEnv: getSiteDisplayEnv(),
    homepageUrl: config.app.homepageUrl,
    webpackAssets,
    isUAA: config.env.authIDP === 'uaa',
  };

  return context;
}

module.exports = {
  home(req, res) {
    // redirect to main app if is authenticated
    if (req.session.authenticated) {
      return res.redirect('/sites');
    }
    const context = defaultContext(req);

    return res.render('home.njk', context);
  },

  systemUse(req, res) {
    const context = defaultContext(req);

    return res.render('system-use.njk', context);
  },

  app(req, res) {
    if (!req.session.authenticated) {
      req.flash('error', 'You are not permitted to perform this action. Are you sure you are logged in?');
      return res.redirect('/');
    }

    const context = defaultContext(req);

    context.isAuthenticated = true;
    context.username = req.user.username;
    context.siteWideError = SiteWideErrorLoader.loadSiteWideError();
    context.csrfToken = req.csrfToken();
    context.accessToken = jwtHelper.sign({ user: req.user.id });
    context.socketHost = process.env.SOCKET_HOST;

    const frontendConfig = {
      TEMPLATES: config.templates,
    };

    context.frontendConfig = frontendConfig;

    return res.render('app.njk', context);
  },

  robots(req, res) {
    const PROD_CONTENT = 'User-Agent: *\nDisallow: /preview\n';
    const DENY_ALL_CONTENT = 'User-Agent: *\nDisallow: /\n';

    res.set('Content-Type', 'text/plain');

    // If this is the production instance and the request came to the production hostname
    if (config.app.app_env === 'production'
      && config.app.hostname === `https://${req.hostname}`) {
      // then send the production robots.txt content
      return res.send(PROD_CONTENT);
    }

    // otherwise send the "deny all" robots.txt content
    return res.send(DENY_ALL_CONTENT);
  },

  notFound(req, res) {
    const context = defaultContext(req);
    if (req.session.authenticated) {
      context.isAuthenticated = true;
      context.username = req.user.username;
      context.accessToken = jwtHelper.sign({ user: req.user.id });
      context.socketHost = process.env.SOCKET_HOST;
    }

    res.render('404.njk', context);
  },
};
