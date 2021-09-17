const router = require('express').Router();

const UserController = require('../controllers/user');
const { sessionAuth } = require('../middlewares');

router.get('/me', sessionAuth, UserController.me);

module.exports = router;
