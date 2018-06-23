const BuildCounter = require('../services/BuildCounter');
const { Site } = require('../models');
const SiteWideErrorLoader = require('../services/SiteWideErrorLoader');
const config = require('../../config');
const { loadAssetManifest, getSiteDisplayEnv, shouldIncludeTracking } = require('../utils');
const caseStudyData = require('../../public/data/case-studies');

let webpackAssets = loadAssetManifest();

function defaultContext(req) {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // reload the webpack assets during development so we don't have to
    // restart the server for front end changes
    webpackAssets = loadAssetManifest();
  }

  const messages = {
    errors: req.flash('error'),
  };

  const context = {
    isAuthenticated: false,
    messages,
    shouldIncludeTracking: shouldIncludeTracking(),
    siteDisplayEnv: getSiteDisplayEnv(),
    webpackAssets,
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

    return Promise.all([
      BuildCounter.countBuildsFromPastWeek(),
      Site.count(),
    ])
    .then(([builds, sites]) => {
      context.buildCount = builds;
      context.siteCount = sites;
      res.render('home.njk', context);
    });
  },

  examples(req, res) {
    // redirect to main app if is authenticated
    if (req.session.authenticated) {
      return res.redirect('/sites');
    }

    const context = Object.assign({}, defaultContext(req), caseStudyData);

    return res.render('content/case-studies.njk', context);
  },

  contact(req, res) {
    const context = defaultContext(req);

    if (req.session.authenticated) {
      context.isAuthenticated = true;
      context.username = req.user.username;
    }

    return res.render('content/contact.njk', context);
  },

  features(req, res) {
    const context = Object.assign({}, defaultContext(req));

    return res.render('features.njk', context);
  },

  app(req, res) {
    if (!req.session.authenticated) {
      req.flash('error', {
        title: 'Unauthorized',
        message: 'You are not permitted to perform this action. Are you sure you are logged in?',
      });
      return res.redirect('/');
    }

    const context = defaultContext(req);

    context.isAuthenticated = true;
    context.username = req.user.username;
    context.siteWideError = SiteWideErrorLoader.loadSiteWideError();
    context.csrfToken = req.csrfToken();

    const frontendConfig = {
      TEMPLATES: config.templates,
      PREVIEW_HOSTNAME: config.app.preview_hostname,
    };

    context.frontendConfig = frontendConfig;

    return res.render('app.njk', context);
  },

  robots(req, res) {
    const PROD_CONTENT = 'User-Agent: *\nDisallow: /preview\n';
    const DENY_ALL_CONTENT = 'User-Agent: *\nDisallow: /\n';

    res.set('Content-Type', 'text/plain');

    // If this is the production instance and the request came to the production hostname
    if (config.app.app_env === 'production' &&
      config.app.hostname === `https://${req.hostname}`) {
      // then send the production robots.txt content
      return res.send(PROD_CONTENT);
    }

    // otherwise send the "deny all" robots.txt content
    return res.send(DENY_ALL_CONTENT);
  },
};
