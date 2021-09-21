const { User, Site } = require('../models');

const getSiteRoom = siteId => `site-${siteId}`;
const getBuilderRoom = (siteId, userId) => `site-${siteId}-user-${userId}`;

const joinRooms = async (socket) => {
  const userId = socket.request.user?.id;
  if (!userId) {
    return;
  }

  const user = await User.findOne({
    where: { id: userId },
    include: [{ model: Site }],
  });

  user.Sites.forEach((s) => {
    switch (s.SiteUser.buildNotificationSetting) {
      case 'builds':
        socket.join(getBuilderRoom(s.id, user.id));
        break;
      case 'none':
        break;
      default:
        socket.join(getSiteRoom(s.id));
    }
  });
};

module.exports = { joinRooms, getSiteRoom, getBuilderRoom };
