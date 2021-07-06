const router = require('express').Router();

const UserController = require('../controllers/user');
const sessionAuth = require('../policies/sessionAuth');

router.get('/me', sessionAuth, UserController.me);

module.exports = router;
