const router = require('express').Router();
const PreviewController = require('../controllers/preview');

// These /preview/ routes provide redirects to the proxy app
// (configured as config.app.preview_hostname).
// They are used to not break existing links from when
// Federalist site previews were handled in this application instead
// of by federalist-proxy.

router.get('/preview/:owner/:repo/:branch', PreviewController.redirect);
router.get('/preview/:owner/:repo/:branch/*', PreviewController.redirect);

module.exports = router;
