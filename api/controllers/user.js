const userSerializer = require('../serializers/user');

module.exports = {
  me(req, res) {
    res.json(userSerializer.toJSON(req.user));
  },
};
