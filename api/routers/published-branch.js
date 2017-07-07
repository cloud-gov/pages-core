const router = require('express').Router();
const PublishedBranchController = require('../controllers/published-branch');
const sessionAuth = require('../policies/sessionAuth');

router.get('/v0/site/:site_id/published-branch', sessionAuth, PublishedBranchController.find);
router.get('/v0/site/:site_id/published-branch/:branch', sessionAuth, PublishedBranchController.findOne);

module.exports = router;
