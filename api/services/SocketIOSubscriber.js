const { User, Site } = require('../models');

module.exports = {
  joinRooms: (_socket) => {
    const userId = _socket.request.session.passport.user;
    User.findOne({
      where: { id: userId },
      include: [{ model: Site }],
    })
    .then((user) => {
      user.Sites.forEach(s => _socket.join(s.id));
      return Promise.resolve();
    })
    .catch(err => logger.error(err));
  }
};
