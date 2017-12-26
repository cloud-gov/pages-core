const { User, UserAction, ActionType } = require('../models');

const serializeObject = user => user.toJSON();
const includedModels = [{
  model: UserAction,
  as: 'userActions',
  attributes: ['id', 'targetType', 'createdAt'],
  include: [{
    model: User,
    as: 'actionTarget',
    attributes: ['id', 'username', 'email', 'createdAt'],
  },
  {
    model: ActionType,
    as: 'actionType',
    attributes: ['action'],
  }],
}];

const serialize = (serializable) => {
  if (serializable.length !== undefined) {
    const userIds = serializable.map(user => user.id);
    const query = User.findAll({ where: { id: userIds }, include: includedModels });

    return query.then(users => users.map(serializeObject));
  }

  const query = User.findById(serializable.id, { include: includedModels });

  return query.then(serializeObject);
};


module.exports = { serialize };
