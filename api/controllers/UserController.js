/**
 * UserController
 *
 * @description :: Server-side logic for managing builds
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  /*
   * Return an object of usernames
   */
  usernames: function(req, res) {
    User.find({}).exec(function(err, users) {
      if (err) return res.serverError(err);
      res.send(_.reduce(users, function(memo, user) {
        memo[user.id] = user.username;
        return memo;
      }, {}));
    });
  },

  'add-site': function(req, res) {
    var owner = req.param('owner'),
        repository = req.param('repository'),
        user = req.user;

    if (!owner || !repository) {
      return res.badRequest('Please specify a repository owner and name.')
    }

    req.body.users = [user.id]

    async.series([
      checkPermissions,
      checkSite
    ], function(err) {
      if (err) {
        return res.badRequest(err);
      }
    });

    function checkPermissions(done) {
      GitHub.checkPermissions(user, owner, repository).then(permissions => {
        if (permissions && permissions.push) {
          done()
        } else {
          done("You do not have write access to this repository")
        }
      }).catch(done)
    }

    function checkSite(done) {
      Site.findOrCreate({
        owner: owner,
        repository: repository
      }, req.body).populate('users').exec(function(err, site) {
        if (err) return done(err);
        if (site.length) site = site[0];
        if (_(site.users).pluck('id').contains(user.id)) {
          return done('You have already added this site to Federalist');
        }
        if (site.users.length) {
          site.users.add(user);
          site.save(function(err) {
            if (err) return done(err);
            return res.json(site);
          });
        } else {
          return res.json(site);
        }
      });
    }
  },

  me: (req, res) => {
    User.findOne(req.user.id).populate("builds").populate("sites").then(user => {
      res.json(user.toObject())
    })
  }
};
