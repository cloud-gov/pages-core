const router = require('express').Router();

const UserController = require('../controllers/user');
const { sessionAuth } = require('../middlewares');
const Features = require('../features');

router.get('/me', sessionAuth, UserController.me);
router.delete('/me/githubtoken', sessionAuth, UserController.revokeApplicationGrant);
if (Features.enabled(Features.Flags.FEATURE_WORKSHOP_INTEGRATION)) {
  router.delete('/me/gitlabtoken', sessionAuth, UserController.revokeUserGitLabTokens);
}

module.exports = router;
