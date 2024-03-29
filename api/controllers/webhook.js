const { wrapHandlers } = require('../utils');
const Webhooks = require('../services/Webhooks');

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
});
