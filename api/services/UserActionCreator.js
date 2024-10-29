const { UserAction, ActionType } = require('../models');

const buildUserAction =
  (actionType) =>
  ({ userId, targetId, targetType, siteId }) =>
    ActionType.findOne({
      where: {
        action: actionType,
      },
    }).then((action) =>
      UserAction.create({
        userId,
        targetId,
        targetType,
        actionId: action.id,
        siteId,
      }),
    );

const addRemoveAction = buildUserAction('remove');
const addUpdateAction = buildUserAction('update');
const addCreateAction = buildUserAction('add');

module.exports = {
  addRemoveAction,
  addUpdateAction,
  addCreateAction,
};
