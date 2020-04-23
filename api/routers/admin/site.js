const { Router } = require('express');
const AdminSiteController = require('../../controllers/admin/site');
const SiteController = require('../../controllers/site');
const adminSessionAuth = require('../../policies/adminSessionAuth');

const router = Router();
router.get('/sites', adminSessionAuth, AdminSiteController.findAllSites);
router.get('/site/:id', adminSessionAuth, SiteController.findById);

module.exports = router;
