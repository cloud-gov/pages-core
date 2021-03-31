const router = require('express').Router();
const config = require('../../config');
const { Event, User } = require('../models');
const passport = require('../services/passport');
const EventCreator = require('../services/EventCreator');

const idp = config.env.authIDP;

const opts = {
  failureRedirect: '/',
  failureFlash:
    'Apologies; you are not authorized to access Federalist! Please contact the Federalist team if this is in error.',
};

function redirectIfAuthenticated(req, res, next) {
  // eslint-disable-next-line no-unused-expressions
  req.session.authenticated ? res.redirect('/') : next();
}

function onSuccess(req, res) {
  req.session.authenticated = true;
  req.session.authenticatedAt = new Date();
  req.session.save(() => {
    res.redirect(req.session.authRedirectPath || '/');
  });
}

router.get('/logout', passport.logout(idp));
router.get('/login', redirectIfAuthenticated, passport.authenticate(idp));
router.get('/auth/github/callback', passport.authenticate('github', opts), onSuccess);

// Callbacks need to be registered with CF UAA service
router.get('/auth/uaa/callback', passport.authenticate('uaa', opts), onSuccess);
router.get('/auth/uaa/logout', (_req, res) => res.redirect('/'));

// New Github authorization only routes
const onGithubSuccess = async (req, res) => {
  const githubUser = req.user;

  const user = await User.findByPk(req.session.passport.user);
  await user.update({
    ...githubUser,
    signedInAt: new Date(),
  });

  EventCreator.audit(Event.labels.AUTHENTICATION, user, 'GitHub authentication');

  const script = `
    <script>
      window.opener.postMessage("success", "*")
    </script>
  `;

  res.send(script);
};

router.get('/auth/github2', passport.authenticate('github2'));
router.get('/auth/github2/callback', passport.authenticate('github2', { session: false }), onGithubSuccess);

module.exports = router;
