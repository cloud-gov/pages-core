const logger = require('winston');
const { User, Site } = require('../models');

module.exports = {
  joinRooms: (_socket) => {
    if (_socket.request && _socket.request.session && _socket.request.session.passport) {
      const userId = _socket.request.session.passport.user;
      if (userId) {
        return User.findOne({
          where: { id: userId },
          include: [{ model: Site }],
        })
        .then((user) => {
          user.Sites.forEach(s => _socket.join(s.id));
          return Promise.resolve();
        })
        .catch(err => logger.error(err));
      }
    }
    return Promise.resolve();
  },
};
