const logger = require('winston');
const { User, Site } = require('../models');

const getSiteRoom = siteId => `site-${siteId}`;
const getBuilderRoom = (siteId, userId) => `site-${siteId}-user-${userId}`;

const joinRooms = (_socket) => {
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
            _socket.join(getBuilderRoom(s.id, user.id));
            break;
          case 'none':
            break;
          default:
            _socket.join(getSiteRoom(s.id));
        }
      });
      return Promise.resolve();
    })
    .catch(err => logger.error(err));
  }
  return Promise.resolve();
};
module.exports = { joinRooms, getSiteRoom, getBuilderRoom };
