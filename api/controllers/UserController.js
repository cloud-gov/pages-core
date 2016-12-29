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

  me: (req, res) => {
    User.findOne(req.user.id).populate("builds").populate("sites").then(user => {
      res.json(user.toObject())
    })
  }
};
