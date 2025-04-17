const { wrapHandlers } = require('../utils');
const Webhooks = require('../services/Webhooks');
const { decrypt } = require('../services/Encryptor');
const { encryption } = require('../../config');
const QueueJobs = require('../queue-jobs');
const { createQueueConnection } = require('../utils/queues');

const connection = createQueueConnection();
const queueJob = new QueueJobs(connection);

module.exports = wrapHandlers({
  async github(req, res) {
    const { body: payload } = req;

    await Webhooks.pushWebhookRequest(payload);

    res.ok();
  },

  async organization(req, res) {
    const { body: payload } = req;

    await Webhooks.organizationWebhookRequest(payload);

    res.ok();
  },

  async site(req, res) {
    const { body } = req;

    try {
      const userEmail = decrypt(body.userEmail, encryption.key);
      const apiKey = decrypt(body.apiKey, encryption.key);
      const siteId = decrypt(body.siteId, encryption.key);
      const siteName = decrypt(body.siteName, encryption.key);
      const orgName = decrypt(body.org, encryption.key);

      await queueJob.createEditorSiteQueue({
        userEmail,
        apiKey,
        siteId,
        siteName,
        orgName,
      });

      return res.ok();
    } catch {
      res.badRequest();
    }
  },
});
