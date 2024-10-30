const router = require('express').Router();
const PublishedFileController = require('../controllers/published-file');
const { sessionAuth } = require('../middlewares');

router.get(
  '/site/:site_id/published-branch/:branch/published-file',
  sessionAuth,
  PublishedFileController.find,
);

module.exports = router;
