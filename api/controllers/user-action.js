const { showActions } = require('../authorizers/site');
const { UserAction, User, ActionType } = require('../models');
const userActionSerializer = require('../serializers/user-action');

const validId = (maybeId) => {
  const idToNumber = Number(maybeId);

  return Promise.resolve(idToNumber)
  .then((id) => {
    if (isNaN(id)) {
      throw 404;
    }

    return id;
  });
};

module.exports = {
  find(req, res) {
    /**
     * WHAT ACTUALLY NEEDS TO HAPPEN
     *
     * validId ->
     * userAuthorized ->
     * complicated site + actions query ->
     * serialize results ->
     * res.json
     */

    validId(req.params.site_id)
    .then(id =>
      id
      //showActions(req.user, { id })
    )
    .then(id =>
      UserAction.findAllBySite({ UserAction, User, ActionType }, id)
    )
    .then(userActions => {
      if (!userActions) {
        throw 404;
      }

      return userActions;
    })
    .then(userActionSerializer.serialize)
    .then(serialized => res.json(serialized))
    .catch(res.error);
  },
};
