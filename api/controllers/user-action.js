const { showActions } = require('../authorizers/site');
const { UserAction } = require('../models');
const userActionSerializer = require('../serializers/user-action');
const { toInt } = require('../utils');

module.exports = {
  find(req, res) {
    const id = toInt(req.params.site_id);
    showActions(req.user, { id })
      .then(siteId => UserAction.findAllBySite(siteId))
      .then(userActions => userActions || [])
      .then(userActionSerializer.serialize)
      .then(serialized => res.json(serialized))
      .catch(res.error);
  },
};
