/**
 * SiteController
 *
 * @description :: Server-side logic for managing sites
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  fork: function forkSiteFromTemplate(req, res) {
    if (!req.param('templateId')) return res.notFound();

    var user = req.user,
        templateId = req.param('templateId');
    GitHub.forkRepository(user, templateId, function(err, newSite) {
      if (err) return res.serverError(err);
      res.send(newSite);
    });
  },

  lock: function lockEditing(req, res) {
    var roomName = req.param('file');

    if (!req.isSocket || !roomName) return res.badRequest();

    req.socket.on('disconnect', function() {
      broadcast(roomName);
    });

    sails.sockets.join(req.socket, roomName);

    res.json({ id: req.socket.id });
    broadcast(roomName);
  },

  unlock: function unlockEditing(req, res) {
    var roomName = req.param('file'),
        data = {};
    if (!req.isSocket || !roomName) return res.badRequest();
    sails.sockets.leave(req.socket, roomName);
    broadcast(roomName);
  }

};

function broadcast(roomName) {
  sails.io.to(roomName).emit('change', {
    room: roomName,
    subscribers: sails.sockets.subscribers(roomName)
  });
}
