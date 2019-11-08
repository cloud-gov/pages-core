const router = require('express').Router();
const ScanController = require('../controllers/scan');
const sessionAuth = require('../policies/sessionAuth');
const csrfProtection = require('../policies/csrfProtection');

// enable csrf protection for all scan routes
// note that this must come before the route definitions
router.use(csrfProtection);

// router.post('scan/upload', sessionAuth, ScanController.create);
router.post('/scan/upload', ScanController.create);
module.exports = router;
