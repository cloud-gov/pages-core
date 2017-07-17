const router = require('express').Router();
const UserController = require('../controllers/user');
const sessionAuth = require('../policies/sessionAuth');

router.get('/v0/usernames', sessionAuth, UserController.usernames);
router.get('/v0/me', sessionAuth, UserController.me);

module.exports = router;
