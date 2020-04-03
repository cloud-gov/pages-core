const { Router } = require('express');
const SiteController = require('../../controllers/site');
const adminSessionAuth = require('../../policies/adminSessionAuth');

const router = Router();
router.get('/sites', adminSessionAuth, SiteController.findAllSites);
router.get('/site/:id', adminSessionAuth, SiteController.findById);

module.exports = router;
