const router = require('express').Router();
const config = require('../../config');
const passport = require('../services/passport');

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
router.get('/auth/gitlab/callback', passport.authenticate('gitlab', opts), onSuccess);

// Callbacks need to be registered with SSO service
router.get('/auth/sso/callback', passport.authenticate('sso', opts), onSuccess);
router.get('/auth/sso/logout', (_req, res) => res.redirect('/'));

module.exports = router;
