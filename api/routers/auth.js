const router = require('express').Router();
const { Event, User } = require('../models');
const passport = require('../services/passport');
const EventCreator = require('../services/EventCreator');

const opts = {
  failureRedirect: '/',
  failureFlash: true,
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

router.get('/logout', passport.logout('uaa'));
router.get('/logout/github', passport.logout('github'));
router.get('/login', redirectIfAuthenticated, passport.authenticate('uaa'));
router.get('/login/github', redirectIfAuthenticated, passport.authenticate('github'));
router.get('/auth/github/callback', passport.authenticate('github', opts), onSuccess);

// Callbacks need to be registered with CF UAA service
router.get('/auth/uaa/callback', passport.authenticate('uaa', opts), onSuccess);
router.get('/auth/uaa/logout', (_req, res) => res.redirect('/'));

// New Github authorization only routes
const onGithubSuccess = async (req, res) => {
  const githubUser = req.user;

  const user = await User.findByPk(req.session.passport.user.id);
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
