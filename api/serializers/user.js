const { User } = require('../models');

const serializeObject = user => user.toJSON();

const serialize = (serializable) => {
  if (serializable.length !== undefined) {
    const userIds = serializable.map(user => user.id);
    const query = User.findAll({ where: { id: userIds } });

    return query.then(users => users.map(serializeObject));
  }

  const query = User.findById(serializable.id);

  return query.then(serializeObject);
};


module.exports = { serialize };
