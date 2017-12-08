const router = require('express').Router();

const ContentController = require('../controllers/content');

router.get('/*', ContentController.serve);

module.exports = router;
