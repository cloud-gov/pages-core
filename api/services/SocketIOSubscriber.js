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
        user.Sites.forEach(s => {
          if (s.SiteUser.buildNotify === 'builds') {
            _socket.join(`user-${user.id}`);
          } else if (s.SiteUser.buildNotify === 'none') {
          } else {
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
