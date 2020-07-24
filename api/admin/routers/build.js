const { Router } = require('express');
const BuildController = require('../../controllers/build');
const AdminBuildController = require('../controllers/build');

const router = Router();
router.get('/builds', AdminBuildController.findAllBuilds);
router.get('/site/:site_id/build', BuildController.find);

module.exports = router;
