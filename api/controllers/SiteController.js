/**
 * SiteController
 *
 * @description :: Server-side logic for managing sites
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  clone: function cloneSite(req, res) {
    var data = {
      owner: req.body.destinationOrg || req.user.username,
      repository: req.body.destinationRepo,
      defaultBranch: req.body.destinationBranch,
      engine: req.body.engine,
      user: req.user
    };
    Site.create(data).populate('users').exec(function(err, site) {
      if (err) return res.serverError(err);
      var build = {
        user: site.users[0].id,
        site: model.id,
        branch: model.defaultBranch,
        source: {
          repository: req.body.sourceRepo,
          owner: req.body.sourceOwner
        }
      };
      Build.create(build, function(err) {
        if (err) return res.serverError(err);
        res.send(site);
      });
    });
  },

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

    // If the socket disconnects (page refresh, browser close), notify others
    req.socket.on('disconnect', function() {
      broadcast(roomName);
    });

    // Join a socket.io room based on the file name
    sails.sockets.join(req.socket, roomName);

    // Send the current state of the room to the user
    res.json({
      id: req.socket.id,
      room: roomName,
      subscribers: sails.sockets.subscribers(roomName)
    });

    // Notify all other users that someone else joined
    broadcast(roomName);
  },

  unlock: function unlockEditing(req, res) {
    var roomName = req.param('file');
    if (!req.isSocket || !roomName) return res.badRequest();

    // Remove the user from the room (used when a user navigates away without
    // breaking the socket connection)
    sails.sockets.leave(req.socket, roomName);

    // Notify others
    broadcast(roomName);
  }

};

// General function to broadcast the current users
// of a room to all users in the room
function broadcast(roomName) {
  sails.io.to(roomName).emit('change', {
    room: roomName,
    subscribers: sails.sockets.subscribers(roomName)
  });
}
