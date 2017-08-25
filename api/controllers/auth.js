const passport = require('../services/passport');

const AuthController = {
  logout(req, res) {
    passport.logout(req, res);
  },

  github(req, res) {
    if (req.session.authenticated) {
      res.redirect('/');
    } else {
      passport.authenticate('github')(req, res, req.next);
    }
  },

  callback(req, res) {
    passport.callback(req, res);
  },
};

module.exports = AuthController;
