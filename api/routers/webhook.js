const router = require('express').Router();
const WebhookController = require('../controllers/webhook');

router.post('/webhook/github', WebhookController.github);
router.post('/webhook/organization', WebhookController.organization);

module.exports = router;
