const { Site } = require('../models');

const getSiteRoom = siteId => `site-${siteId}`;
const getBuilderRoom = (siteId, userId) => `site-${siteId}-user-${userId}`;

const joinRooms = async (socket) => {
  const { user } = socket.request;
  if (!user) {
    return;
  }

  const sites = await Site.forUser(user).findAll();

  sites.forEach((site) => {
    switch (user.buildNotificationSettings[site.id]) {
      case 'builds':
        socket.join(getBuilderRoom(site.id, user.id));
        break;
      case 'none':
        break;
      default:
        socket.join(getSiteRoom(site.id));
    }
  });
};

module.exports = { joinRooms, getSiteRoom, getBuilderRoom };
