const router = require('express').Router();
const externalAuth = require('../policies/externalAuth');

const ExternalAuthController = require('../controllers/external-auth');
const passport = require('../services/passport');

router.get('/external/auth/github', externalAuth, passport.authenticate('external', { session: false }));
router.get('/external/auth/github/callback', passport.authenticate('external', { session: false }), ExternalAuthController.callback);

module.exports = router;
