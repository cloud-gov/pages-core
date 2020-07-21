const router = require('express').Router();
const AdminAuthController = require('../../controllers/admin-auth');

router.get('/auth/github', AdminAuthController.github);
router.get('/auth/github/callback', AdminAuthController.callback);
router.get('/logout', AdminAuthController.logout);

module.exports = router;
