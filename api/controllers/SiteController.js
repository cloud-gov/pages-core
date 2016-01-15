/**
 * SiteController
 *
 * @description :: Server-side logic for managing sites
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  clone: function cloneSite(req, res) {
    var data = {
      owner: req.param('destinationOrg') || req.user.username,
      repository: req.param('destinationRepo'),
      defaultBranch: req.param('destinationBranch'),
      engine: req.param('engine'),
      users: [req.user.id]
    };
    Site.create(data).exec(function(err, site) {
      if (err) return res.serverError(err);
      var build = {
        user: req.user.id,
        site: site.id,
        branch: site.defaultBranch,
        source: {
          repository: req.param('sourceRepo'),
          owner: req.param('sourceOwner')
        }
      };

      Site.findOne({
        id: site.id
      }).populate('builds').exec(function(err, site) {
        if (err) return res.serverError(err);

        // Delete the build that runs automatically when the site is created
        Build.destroy({ id: site.builds[0].id }).exec(function(err) {
          console.log('build destroyed');
          if (err) return res.serverError(err);
        });

        // Create build with clone repo
        Build.create(build, function(err, model) {
          if (err) return res.serverError(err);
          res.send(site);
        });
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
