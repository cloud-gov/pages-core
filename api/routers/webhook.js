const crypto = require('crypto');
const router = require('express').Router();
const config = require('../../config');
const WebhookController = require('../controllers/webhook');

const signBlob = (key, blob) =>
  `sha1=${crypto.createHmac('sha1', key).update(blob).digest('hex')}`;

const signWebhookRequest = (payload, headers) => {
  const webhookSecret = config.webhook.secret;
  const requestBody = JSON.stringify(payload);

  const signature = headers['x-hub-signature'];
  const signedRequestBody = signBlob(webhookSecret, requestBody);

  if (!signature) {
    throw new Error('No X-Hub-Signature found on request');
  } else if (signature !== signedRequestBody) {
    throw new Error('X-Hub-Signature does not match blob signature');
  }
};

function verifySignature(req, res, next) {
  const { body: payload, headers } = req;

  try {
    signWebhookRequest(payload, headers);
  } catch (err) {
    res.badRequest();
    next(err);
  }
  next();
}

function verifySiteRequest(req, res, next) {
  const { body: payload } = req;

  // ToDo Add additional headers to check if request is legit

  try {
    const hasKeys = Object.keys(payload).includes([
      'userEmail',
      'apiKey',
      'siteId',
      'siteName',
      'org',
    ]);

    if (!hasKeys) throw new Error('Invalid request payload');
  } catch (err) {
    res.badRequest();
    next(err);
  }

  next();
}

router.post('/webhook/github', verifySignature, WebhookController.github);
router.post('/webhook/organization', verifySignature, WebhookController.organization);
router.post('/webhook/site', verifySiteRequest, WebhookController.site);

module.exports = router;
