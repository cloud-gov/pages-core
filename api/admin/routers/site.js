const { Router } = require('express');
const AdminSiteController = require('../controllers/site');
const SiteController = require('../../controllers/site');

const router = Router();
router.get('/sites', AdminSiteController.findAllSites);
router.get('/site/:id', SiteController.findById);

module.exports = router;
