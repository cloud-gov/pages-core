const { Router } = require('express');
const BuildController = require('../../controllers/build');
const AdminBuildController = require('../../controllers/admin/build');
const adminSessionAuth = require('../../policies/adminSessionAuth');

const router = Router();
router.get('/builds', adminSessionAuth, AdminBuildController.findAllBuilds);
router.get('/site/:site_id/build', adminSessionAuth, BuildController.find);

module.exports = router;
