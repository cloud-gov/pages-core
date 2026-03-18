const router = require('express').Router();

const UserController = require('../controllers/user');
const { csrfProtection, sessionAuth } = require('../middlewares');
const Features = require('../features');

router.get('/me', sessionAuth, UserController.me);
router.put('/me/settings', sessionAuth, csrfProtection, UserController.updateSettings);
router.delete('/me/githubtoken', sessionAuth, UserController.revokeApplicationGrant);
if (Features.enabled(Features.Flags.FEATURE_FILE_STORAGE_SERVICE)) {
  router.delete('/me/gitlabtoken', sessionAuth, UserController.revokeUserGitLabTokens);
}

module.exports = router;
