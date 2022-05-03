const config = require('../../config');
const SiteWideErrorLoader = require('../services/SiteWideErrorLoader');
const { defaultContext } = require('../utils');
const Mailer = require('../services/mailer');
const UAAClient = require('../utils/uaaClient');

function alertGithubAuthDeprecation(hasUAAIdentity, context) {
  if (!hasUAAIdentity && context.authUAA) {
    context.messages = {
      ...context.messages,
      warnings: [
        `Authenticating with Github is deprecated and will be removed soon. Contact your agreement owner or ${config.app.supportEmail} to setup a cloud.gov account.`,
      ],
    };
  }
}

module.exports = {
  home(req, res) {
    // redirect to main app if is authenticated
    if (req.session.authenticated) {
      if (!req.user.UAAIdentity) {
        return res.redirect('/migrate/new');
      }
      return res.redirect('/sites');
    }
    const context = defaultContext(req, res);

    return res.render('home.njk', context);
  },

  migrateNew(req, res) {
    if (!req.session.authenticated) {
      req.flash('error', 'You are not permitted to perform this action. Are you sure you are logged in?');
      return res.redirect('/');
    }

    if (req.user.UAAIdentity) {
      return res.redirect('/sites');
    }

    const context = defaultContext(req, res);

    context.username = req.user.username;
    context.csrfToken = req.csrfToken();

    return res.render('migrate.njk', context);
  },

  async migrateCreate(req, res) {
    if (!req.session.authenticated) {
      req.flash('error', 'You are not permitted to perform this action. Are you sure you are logged in?');
      return res.redirect('/');
    }

    const { body: { uaaEmail }, user } = req;

    if (user.UAAIdentity) {
      req.flash('error', 'You already have a cloud.gov account, please logout and log back in using cloud.gov authentication');
      return res.redirect('/logout/github');
    }

    if (!uaaEmail) {
      req.flash('error', 'Please provide a valid email address for your cloud.gov account.');
      return res.redirect('/migrate/new');
    }

    const uaaClient = new UAAClient();
    const clientToken = await uaaClient.fetchClientToken();
    const {
      email,
      inviteLink,
      origin,
      userId: uaaId,
    } = await uaaClient.inviteUserToUserGroup(uaaEmail, clientToken);

    await user.createUAAIdentity({
      email,
      origin,
      uaaId,
      userName: email,
    });

    if (inviteLink) {
      await Mailer.sendUAAInvite(email, inviteLink);
    }

    return res.redirect('/migrate/success');
  },

  migrateSuccess(req, res) {
    if (!req.session.authenticated) {
      req.flash('error', 'You are not permitted to perform this action. Are you sure you are logged in?');
      return res.redirect('/');
    }

    const context = defaultContext(req, res);

    return res.render('migrate-success.njk', context);
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
    const DENY_ALL_CONTENT = 'User-Agent: *\nDisallow: /\n';

    res.set('Content-Type', 'text/plain');

    // send the "deny all" robots.txt content
    return res.send(DENY_ALL_CONTENT);
  },
};
