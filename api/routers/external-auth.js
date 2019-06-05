const router = require('express').Router();

const ExternalAuthController = require('../controllers/external-auth');
const passport = require('../services/passport');

router.get('/external/auth/github', passport.authenticate('external', { session: false }));
router.get('/external/auth/github/callback', passport.authenticate('external', { session: false }), ExternalAuthController.callback);

module.exports = router;
