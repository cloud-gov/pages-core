const logger = require('winston');
const { User, Site } = require('../models');

module.exports = {
  joinRooms: (_socket) => {
    if (_socket.handshake && _socket.handshake.session && _socket.handshake.session.passport) {
      const userId = _socket.handshake.session.passport.user;
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
