const router = require('express').Router();
const PublishedFileController = require('../controllers/published-file');
const sessionAuth = require('../policies/sessionAuth');

router.get('/v0/site/:site_id/published-branch/:branch/published-file', sessionAuth, PublishedFileController.find);

module.exports = router;
