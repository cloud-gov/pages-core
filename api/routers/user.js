const router = require('express').Router();

const UserController = require('../controllers/user');
const { csrfProtection, sessionAuth } = require('../middlewares');

router.get('/me', sessionAuth, UserController.me);
router.put('/me/settings', sessionAuth, csrfProtection, UserController.updateSettings);
router.delete('/me/githubtoken', sessionAuth, UserController.revokeApplicationGrant);
router.delete('/me/gitlabtoken', sessionAuth, UserController.revokeUserGitLabTokens);

module.exports = router;
