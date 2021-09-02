const router = require('express').Router();
const UserActionController = require('../controllers/user-action');
const { sessionAuth } = require('../middlewares');

router.get('/site/:site_id/user-action', sessionAuth, UserActionController.find);

module.exports = router;
