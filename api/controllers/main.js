const config = require('../../config');
const SiteWideErrorLoader = require('../services/SiteWideErrorLoader');
const { loadAssetManifest, getSiteDisplayEnv, shouldIncludeTracking } = require('../utils');
const Features = require('../features');

const webpackAssets = loadAssetManifest();

function defaultContext(req, res) {
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
    authGithub: Features.enabled(Features.Flags.FEATURE_AUTH_GITHUB),
    authUAA: Features.enabled(Features.Flags.FEATURE_AUTH_UAA),
    hasUAAIdentity: false,
    nonce: res.locals.cspNonce,
  };

  return context;
}

function alertGithubAuthDeprecation(hasUAAIdentity, context) {
  if (!hasUAAIdentity && context.authUAA) {
    context.messages = {
      ...context.messages,
      warnings: [
        'Authenticating with Github is deprecated and will be removed soon. Contact your agreement owner or federalist-support@gsa.gov to setup a cloud.gov account.',
      ],
    };
  }
}

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

    alertGithubAuthDeprecation(hasUAAIdentity, context);

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
    const context = defaultContext(req, res);
    if (req.session.authenticated) {
      context.isAuthenticated = true;
      context.username = req.user.username;
    }

    res.render('404.njk', context);
  },
};
