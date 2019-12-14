const userSerializer = require('../serializers/user');
const { User } = require('../models');

module.exports = {
  usernames(req, res) {
    User.findAll()
      .then((users) => {
        const usernames = users.map(user => ({
          id: user.id,
          username: user.username,
        }));
        return res.json(usernames);
      })
      .catch(err => res.error(err));
  },

  me: (req, res) => {
    res.json(userSerializer.toJSON(req.user));
  },
};
