const { Router } = require('express');
const UserController = require('../controllers/user');

const router = Router();
router.get('/me', UserController.me);

module.exports = router;
