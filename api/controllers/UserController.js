const authorizer = require("../authorizers/user")
const userSerializer = require("../serializers/user")

module.exports = {
  usernames: function(req, res) {
    User.findAll().then(users => {
      const usernames = users.map(user => ({
        id: user.id,
        username: user.username,
      }))
      res.json(usernames)
    }).catch(err => {
      res.error(err)
    })
  },

  me: (req, res) => {
    let user

    User.findById(req.user.id).then(model => {
      user = model
      return authorizer.me(req.user, user)
    }).then(() => {
      return userSerializer.serialize(user)
    }).then(userJSON => {
      userJSON.githubUserId = user.githubUserId
      userJSON.githubAccessToken = user.githubAccessToken
      res.json(userJSON)
    }).catch(err => {
      res.error(err)
    })
  }
};
