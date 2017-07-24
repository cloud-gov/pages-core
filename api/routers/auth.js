const router = require('express').Router();
const AuthController = require('../controllers/auth');

router.get('/auth/github', AuthController.github);
router.get('/auth/github/callback', AuthController.callback);
router.get('/logout', AuthController.logout);

module.exports = router;
