const { showActions } = require('../authorizers/site');
const { UserAction } = require('../models');
const userActionSerializer = require('../serializers/user-action');
const { toInt } = require('../utils');
const { wrapHandlers } = require('../utils');

module.exports = wrapHandlers({
  async find(req, res) {
    const id = toInt(req.params.site_id);
    const siteId = await showActions(req.user, { id })
    const  userActions = await UserAction.findAllBySite(siteId);
    const serialized = await userActionSerializer.serialize(userActions || []);
    res.json(serialized);
  },
});
