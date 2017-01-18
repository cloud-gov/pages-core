const authorizer = require("../authorizers/user")

module.exports = {
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
    let user

    User.findOne(req.user.id).populate("builds").populate("sites").then(model => {
      user = model
      return authorizer.me(req.user, user)
    }).then(() => {
      res.json(user.toObject())
    })
  }
};
