const crypto = require('crypto');
const router = require('express').Router();
const config = require('../../config');
const WebhookController = require('../controllers/webhook');
const { logger } = require('../../winston');

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

function verifySiteRequest(expectedKeys) {
  return (req, res, next) => {
    const { body: payload } = req;
    const sortedExpectedKeys = expectedKeys.sort();

    // ToDo Add additional headers to check if request is legit

    try {
      const payloadKeys = Object.keys(payload).sort();

      if (payloadKeys.length !== sortedExpectedKeys.length) {
        throw new Error('Invalid request payload');
      }

      const hasKeys = payloadKeys.every(
        (value, index) => value === sortedExpectedKeys[index],
      );

      if (!hasKeys) throw new Error('Invalid request payload');
    } catch (err) {
      res.badRequest();
      next(err);
    }

    next();
  };
}

function verifyToken(req, res, next) {
  logger.info('GitLab verifyToken', req.headers);

  try {
    verifyGitLabToken(req.headers);
  } catch (err) {
    res.badRequest();
    next(err);
  }
  next();
}

function verifyGitLabToken(headers) {
  logger.info('GitLab verifyGitLabToken');

  const webhookSecret = config.webhook.gitlabSecret;
  const headerSecret = headers['x-gitlab-token'];

  if (!headerSecret) {
    throw new Error('No X-Gitlab-Token found on request');
  } else if (webhookSecret !== headerSecret) {
    throw new Error('X-Gitlab-Token does not match webhook secret');
  }
}

const verifyNewEditorSite = verifySiteRequest([
  'userEmail',
  'apiKey',
  'siteId',
  'siteName',
  'org',
]);

const verifyEditorSiteId = verifySiteRequest(['siteId']);

router.post('/webhook/github', verifySignature, WebhookController.github);
router.post('/webhook/gitlab', verifyToken, WebhookController.gitlab);
router.post('/webhook/organization', verifySignature, WebhookController.organization);
router.post('/webhook/site', verifyNewEditorSite, WebhookController.site);
router.delete('/webhook/site', verifyEditorSiteId, WebhookController.siteDelete);
router.post('/webhook/site/build', verifyEditorSiteId, WebhookController.siteBuild);

module.exports = router;
