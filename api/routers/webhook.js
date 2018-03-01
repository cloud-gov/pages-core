const router = require('express').Router();
const WebhookController = require('../controllers/webhook');

router.post('/webhook/github', WebhookController.github);

module.exports = router;
