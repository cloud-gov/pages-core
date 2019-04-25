const { github } = require('../services/passport');
const config = require('../../config');

const AuthController = {
  logout(req, res) {
    github.logout(req, res);
  },

  github(req, res) {
    if (req.session.authenticated) {
      res.redirect(config.app.homepageUrl);
    } else {
      github.authenticate('github')(req, res, req.next);
    }
  },

  callback(req, res) {
    github.callback(req, res);
  },
};

module.exports = AuthController;
