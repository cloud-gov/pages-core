const logger = require('winston');
const { User, Site } = require('../models');

module.exports = {
  joinRooms: (_socket) => {
    const userId = _socket.user;
    if (userId) {
      return User.findOne({
        where: { id: userId },
        include: [{ model: Site }],
      })
      .then((user) => {
        user.Sites.forEach((s) => {
          switch (s.SiteUser.buildNotify) {
            case 'builds':
              _socket.join(`site-${s.id}-user-${user.id}`);
              break;
            case 'none':
              break;
            default:
              _socket.join(`site-${s.id}`);
          }
        });
        return Promise.resolve();
      })
      .catch(err => logger.error(err));
    }
    return Promise.resolve();
  },
};
