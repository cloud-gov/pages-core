const { defaultContext } = require('../utils');
const AuthMigration = require('../services/AuthMigration');

module.exports = {
  new(req, res) {
    if (req.user.UAAIdentity) {
      return res.redirect('/sites');
    }

    const context = defaultContext(req, res);

    context.username = req.user.username;
    context.csrfToken = req.csrfToken();

    return res.render('migrate.njk', context);
  },

  async create(req, res) {
    const { body: { uaaEmail }, user } = req;

    if (user.UAAIdentity) {
      req.flash('error', 'You already have a cloud.gov account, please logout and log back in using cloud.gov authentication.');
      return res.redirect('/logout/github');
    }

    if (!uaaEmail) {
      req.flash('error', 'Please provide a valid email address for your cloud.gov account.');
      return res.redirect('/migrate/new');
    }

    await AuthMigration.migrateUser(user, uaaEmail);

    return res.redirect('/migrate/success');
  },

  success(req, res) {
    const { user } = req;

    const context = defaultContext(req, res);
    context.uaaEmail = user.UAAIdentity.email;

    return res.render('migrate-success.njk', context);
  },
};
