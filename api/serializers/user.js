const { User, UserAction, ActionType} = require('../models');

const serializeObject = user => user.toJSON();

const serialize = (serializable) => {
  if (serializable.length !== undefined) {
    const userIds = serializable.map(user => user.id);
    const query = User.findAll({ where: { id: userIds }, include: [UserAction] });

    return query.then(users => users.map(serializeObject));
  }

  const user = serializable;
  const query = User.findById(user.id, {
    include: [{
      model: UserAction,
      as: 'userAction',
      attributes: ['targetType', 'createdAt'],
      include: [{
        model: User,
        as: 'actionTarget',
        attributes: ['id', 'username', 'email', 'createdAt'],
      }, {
        model: ActionType,
        as: 'actionType',
        attributes: ['action'],
      }],
    }]
  });

  return query.then(serializeObject);
};


module.exports = { serialize };
